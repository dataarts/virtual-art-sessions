/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as Signal from '../viewer/app/signal';
import $ from 'jquery';
import analytics from '../components/analytics';
import 'jquery-ui/slider';
import '../third_party/jquery.ui.touch-punch';

class SketchProgressBar {
  constructor($element, sketchPlayer) {
    this.dragging = false;
    this.$el = $element;
    this.sketchPlayer = sketchPlayer;
    this.events = {
      onSeekStart: Signal.create(),
      onSeekUpdate: Signal.create(),
      onSeekEnd: Signal.create()
    };
    this.$el.slider({
      min: 0,
      max: 1,
      step: 0.001,
      orientation: 'horizontal',
      range: 'min',
      start: this.onSeekStart_.bind(this),
      stop: this.onSeekEnd_.bind(this),
      slide: this.onSeekUpdate_.bind(this)
    });

    this.wasPlaying_ = null;

    this.sketchPlayer.events.onTick.add(() => {
      if (!this.dragging) {
        this.$el.slider('value', this.sketchPlayer.sketch.progress());
      }
    });
  }

  onSeekStart_(event, ui) {
    // As jQueryUI Touch Punch will fire this callback on both the native
    // touchstart event and a after triggering a simulated mouse event, ensure
    // that we ONLY handle the interaction in the simulated mouse event (e.g.
    // so we don't double track the event to GA).
    if (event.originalEvent && event.originalEvent.type === 'mousedown') {
      const time = this.sketchPlayer.sketch.getCurrentTime();

      this.wasPlaying_ = this.sketchPlayer.sketch.isPlaying();
      this.sketchPlayer.pause();

      this.dragging = true;
      this.sketchPlayer.analytics.pause();
      this.events.onSeekStart.emit();

      analytics('send', 'event', 'viewer', `seek-start:${time}`,
          window.location.pathname);
    }
  }

  onSeekUpdate_(event, ui) {
    this.events.onSeekUpdate.emit();
    this.sketchPlayer.seek(ui.value);
  }

  onSeekEnd_(event, ui) {
    const sketchDuration = this.sketchPlayer.sketch.videoDuration();
    const time = this.getTimeFromSliderPosition(ui.value, sketchDuration);
    this.dragging = false;
    this.sketchPlayer.seek(ui.value);
    this.sketchPlayer.analytics.resume();
    this.sketchPlayer.seek(ui.value);
    this.events.onSeekEnd.emit();

    if (this.wasPlaying_ && !this.sketchPlayer.sketch.isFinished()) {
      this.sketchPlayer.play();
    }

    analytics('send', 'event', 'viewer', `seek-end:${time}`,
        window.location.pathname);
  }

  getTimeFromSliderPosition(sliderValue, sketchDuration) {
    const targetProgress = parseFloat(sliderValue);
    const time = targetProgress * sketchDuration;
    return time;
  }
}

export default SketchProgressBar;
