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
import * as SketchAnalytics from './sketchanalytics';

class SketchPlayer {
  constructor(viewer, sketch) {
    this.analytics = new SketchAnalytics.default(viewer, sketch);
    this.sketch = sketch;
    this.viewer = viewer;
    this.timeout_ = null;
    this.events = {
      onBeginPlay: Signal.create(),
      onEndPlay: Signal.create(),
      onPlaybackComplete: Signal.create(),
      onTick: Signal.create(),
      onSeek: Signal.create()
    };

    this.bindEvents_();
    this.bindCallbacks_();
  }

  bindCallbacks_() {
    let proto = this.constructor.prototype;

    let methods = Object.getOwnPropertyNames(proto).filter(key => {
      let prop = proto[key];
      return typeof prop === 'function' && key !== 'constructor';
    });

    methods.forEach(key => {
      let method = this[key];
      this[key] = (...args) => method.apply(this, args);
    });
  }

  bindEvents_() {
    this.viewer.events.playbackComplete.add(this.onPlaybackComplete_.bind(this));
    this.viewer.events.beginPlay.add(this.onBeginPlay_.bind(this));
    this.viewer.events.endPlay.add(this.onEndPlay_.bind(this));
  }

  onBeginPlay_() {
    this.scheduleTick_();
    this.events.onBeginPlay.emit();
  }

  onEndPlay_() {
    if (this.timeout_) {
      window.clearTimeout(this.timeout_);
    }

    this.events.onEndPlay.emit();
  }

  onPlaybackComplete_() {
    if (this.timeout_) {
      clearTimeout(this.timeout_);
    }

    this.events.onPlaybackComplete.emit();
  }

  pause() {
    if (this.timeout_) {
      clearTimeout(this.timeout_);
    }

    return this.sketch.pause();
  }

  play() {
    return this.sketch.play();
  }

  scheduleTick_() {
    this.timeout_ = setInterval(this.tick_, 1000);
  }

  tick_() {
    this.events.onTick.emit();
  }

  startAutoRotate(speed) {
    this.sketch.orbit.autoRotateSpeed = speed;
    this.sketch.orbit.autoRotate = true;
  }

  seek(perc) {
    this.events.onSeek.emit(perc);
    return this.sketch.seek(perc);
  }
}

export default SketchPlayer;
