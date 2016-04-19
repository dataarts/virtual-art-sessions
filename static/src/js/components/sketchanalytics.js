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
import * as logger from '../utils/logger';
import analytics from '../components/analytics';

const TIMEOUT_INTERVAL = 1 * 1000;
const WATCH_CHUNK_DURATION = 10;

class SketchAnalytics {
  constructor(viewer, sketch) {
    this.viewer_ = viewer;
    this.sketch_ = sketch;
    this.timeout_ = null;
    this.lastBeaconTime_ = 0;
    this.bindEvents_();
    this.paused = false;
  }

  bindEvents_() {
    this.viewer_.events.playbackComplete.add(this.onEndPlay_.bind(this));
    this.viewer_.events.beginPlay.add(this.onBeginPlay_.bind(this));
    this.viewer_.events.endPlay.add(this.onEndPlay_.bind(this));
  }

  onBeginPlay_() {
    logger.debug('analytics:onBeginPlay_');
    window.clearTimeout(this.timeout_);

    if (this.sketch_.isPlaying()) {
      this.scheduleTick_();
    }
  }

  onEndPlay_() {
    logger.debug('analytics:onEndPlay_');
    if (this.timeout_) {
      window.clearTimeout(this.timeout_);
    }
  }

  scheduleTick_() {
    this.timeout_ = window.setTimeout(this.tick_.bind(this), TIMEOUT_INTERVAL);
  }

  pause() {
    logger.info('analytics:pausing...');
    this.paused = true;
    window.clearTimeout(this.timeout_);
  }

  resume() {
    logger.info('analytics:resuming...');
    this.paused = false;
    window.clearTimeout(this.timeout_);

    if (this.sketch_.isPlaying()) {
      this.scheduleTick_();
    }

    // Reset lastBeaconTime_ so that time seeked does not get counted as
    // time watched.
    this.lastBeaconTime_ = this.sketch_.getCurrentTime();
  }

  tick_() {
    logger.debug('analytics:tick');
    let currentTime = this.sketch_.getCurrentTime();
    if (currentTime - this.lastBeaconTime_ > WATCH_CHUNK_DURATION) {
      if (!this.paused) {
        logger.info('analytics:sending beacon.');
        analytics('send', 'event', 'viewer', 'watched', window.location.pathname,
          WATCH_CHUNK_DURATION);
      } else {
        logger.info('analytics:analytics is paused, skipping beacon.');
      }

      this.lastBeaconTime_ = currentTime;
    }

    this.scheduleTick_();
  }
}

export default SketchAnalytics;
