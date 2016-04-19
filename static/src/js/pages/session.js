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
import $ from 'jquery';
import * as App from '../viewer/app';
import * as Engine from '../viewer/engine';
import * as logger from '../utils/logger';
import * as modals from '../components/modals';
import analytics from '../components/analytics';
const bowser = require('bowser');
import SketchPlayer from '../components/sketchplayer';
import SketchProgressBar from '../components/progressbar';

const BIO_HASH = '#/bio';
const CLASSES = {
  ACTIVE: 'is-active',
  FINISHED: 'is-finished',
  PAUSED: 'is-paused',
  PLAYING: 'is-playing',
  SPEED_ENABLED: 'speed-enabled',
};
const $root = $('.session');
const $artistBio = $('.artist');
const $progress = $('.session__progress-bar');
const $loading = $('.viewer__loading-text');
const $timestamp = $('.session__timestamp');
const $playButton = $('.session__play');
const $viewerPlay = $('.viewer__play');
const $replayButton = $('.session__replay');
const $pauseButton = $('.session__pause');
const $enterFullscreen = $('.session__fullscreen');
const $exitFullscreen = $('.session__fullscreen-exit');
const $speedButtons = $('.session__speed');

let sketchPlayer;
let progressBar;
let timestampUpdateTimer;
let promptShownThisSession = false;

/**
 * Flag to store the play state of the player at the point when the arist modal
 * was opened. Used to automatically resume playback of the player once the
 * artist modal is closed, if it was playing when the modal was opened.
 */
let wasPlaying = true;

/**
 * Initialise engine and viewer.
 * @param {Object} options Page-specific options including session slug.
 */
function init(options) {
  $loading.addClass('is-visible');
  const engine = Engine.create();
  const viewer = App.create(engine);
  const modal = modals.get('artist');
  const loadStartTime = new Date().getTime();

  modal.events.onOpen.add(handleArtistOpen_);
  modal.events.onClose.add(handleArtistClose_);

  if (window.location.hash === BIO_HASH) {
    modal.open();
  }

  if (bowser.msie) {
    $enterFullscreen.hide();
  }

  viewer.load(options.sessionSlug).then(sketch => {
    const now = new Date().getTime();
    const loadEndTime = now - loadStartTime;

    var timeToScreen = null;

    $loading.removeClass('is-visible');
    sketchPlayer = new SketchPlayer(viewer, sketch);
    progressBar = new SketchProgressBar($progress, sketchPlayer);

    initEvents_();
    initSpeed_();
    setTimestamp_();
    bindPlayerCallbacks_();

    // start autorotate
    sketchPlayer.startAutoRotate(-0.90);

    if (window.location.hash !== BIO_HASH) {
      sketchPlayer.play();
      checkAutoplay_(sketch);
    }

    analytics('send', 'event', 'sketch', 'load-time', window.location.pathname, loadEndTime);

    if (Modernizr.performance) {
      timeToScreen = now - window.performance.timing.navigationStart;
      analytics('send', 'event', 'sketch', 'time-to-screen', window.location.pathname, timeToScreen);
    }
  });

  $('.js-viewer').append(viewer.domElement());
}

function checkAutoplay_(sketch) {
  let playing;

  if (!sketch.isPlaying()) {
    playing = false;
    onEndPlay_();
    $viewerPlay.addClass('is-visible');
    logger.log('Autoplay appears to have failed.');
  } else {
    playing = true;
    logger.log('Autoplay appears to have succeeded.');
  }

  return playing;
}

/**
 * Initialise hand moving prompt to drag viewer. Set a delay of 5 seconds
 * before removing animation, or when the user clicks on the viewer.
 */
function initPrompt_() {
  if (localStorage.getItem('interacted') === 'true') {
    return;
  }

  $('.viewer__prompt').addClass('is-visible');
  $('.viewer').on('mousedown touchstart', handleViewerClick_);
  setTimeout(function() {
    $('.viewer__prompt').removeClass('is-visible');
  }, 5000);
}

/**
 * Only show speed buttons if the user is not using Android. Ideally we'd have
 * code to detect whether playbackRate performed correctly, but this is
 * difficult to test.
 * @private
 */
function initSpeed_() {
  if (!bowser.android) {
    $root.addClass(CLASSES.SPEED_ENABLED);
    $speedButtons.show();
  }
}

/**
 * Hide the viewer prompt when a user clicks on the viewer.
 */
function handleViewerClick_() {
  $('.viewer__prompt').removeClass('is-visible');
  localStorage.setItem('interacted', 'true');
}

/**
 * Initialise click event listeners for play and pause player controls.
 * @private
 */
function initEvents_() {
  $playButton.on('click', handlePlayClick_);
  $viewerPlay.on('click', handlePlayClick_);
  $replayButton.on('click', handleReplayClick_);
  $pauseButton.on('click', handlePauseClick_);
  $enterFullscreen.on('click', handleFullscreenClick_);
  $exitFullscreen.on('click', handleFullscreenExitClick_);
  $speedButtons.find('button').on('click', handleSpeedClick_);
}

/**
 * Set the sketch's timestamp to a formatted time and duration.
 * @private
 */
function setTimestamp_() {
  const currentTime = formatTime_(sketchPlayer.sketch.getCurrentTime());
  const duration = formatTime_(sketchPlayer.sketch.videoDuration());
  $timestamp.text(currentTime + '/' + duration);

  // Clear any pending timer, since this function could either be called as the
  // result of an onSeekUpdate update event, or from a previous timer firing.
  clearTimeout(timestampUpdateTimer);
  timestampUpdateTimer = setTimeout(setTimestamp_, 500);
}

/**
 * Take time value (in seconds) and converts to mm:ss format.
 * @param {number} time Time value (in seconds).
 * @return {string} A formatted version of the value.
 * @private
 */
function formatTime_(time) {
  time = Number(time);
  const m = Math.floor(time % 3600 / 60);
  const s = Math.floor(time % 3600 % 60);
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function bindPlayerCallbacks_() {
  sketchPlayer.events.onPlaybackComplete.add(onPlaybackComplete_);
  sketchPlayer.events.onBeginPlay.add(onBeginPlay_);
  sketchPlayer.events.onEndPlay.add(onEndPlay_);
  progressBar.events.onSeekUpdate.add(setTimestamp_);
  progressBar.events.onSeekEnd.add(onSeekEnd_);
}

/**
 * Play button event handler.
 * @param {Object} e The event object.
 * @private
 */
function handlePlayClick_(e) {
  e.preventDefault();
  sketchPlayer.play();
}

/**
 * Replay button event handler.
 * @param {Object} e The event object.
 * @private
 */
function handleReplayClick_(e) {
  e.preventDefault();
  sketchPlayer.seek(0);
  sketchPlayer.play();

  // Update timestamp and progress bar immediately.
  setTimestamp_();
  progressBar.$el.slider('value', 0);
}

/**
 * Pause button event handler.
 * @param {Object} e The event object.
 * @private
 */
function handlePauseClick_(e) {
  e.preventDefault();
  sketchPlayer.pause();
}

/**
 * Request full screen access for the document element when full screen button
 * is clicked.
 * @param {Object} e The event object.
 * @private
 */
function handleFullscreenClick_(e) {
  e.preventDefault();

  var requestFullscreen = document.documentElement.requestFullscreen ||
    document.documentElement.mozRequestFullScreen ||
    document.documentElement.webkitRequestFullscreen ||
    document.documentElement.msRequestFullscreen;

  if (requestFullscreen) {
    requestFullscreen.call(document.documentElement);
    analytics('send', 'event', 'viewer', 'fullscreen:requested', window.location.pathname);
  }
}

/**
 * Close or exit full screen mode when close button is clicked.
 * @param {Object} e The event object.
 * @private
 */
function handleFullscreenExitClick_(e) {
  e.preventDefault();
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

/**
 * Speed up or slow down video depending on speed button clicked.
 * @param {Object} e The event object.
 * @private
 */
function handleSpeedClick_(e) {
  e.preventDefault();
  const $btn = $(this);
  const $btns = $('.session__speed button');
  const speed = parseFloat($btn.data('speed'));
  $btns.removeClass(CLASSES.ACTIVE);
  $btn.addClass(CLASSES.ACTIVE);
  sketchPlayer.sketch.setPlaybackRate(speed);
  analytics('send', 'event', 'viewer', `playback-speed:${speed}x`,
      window.location.pathname);
}

function onBeginPlay_() {
  logger.info('session:onBeginPlay_');

  if (!promptShownThisSession) {
    promptShownThisSession = true;
    setTimeout(initPrompt_, 500); // Stop loading and prompt from overlapping.
  }

  $root.addClass(CLASSES.PLAYING);
  $root.removeClass(CLASSES.PAUSED + ' ' + CLASSES.FINISHED);
  $viewerPlay.removeClass('is-visible');
}

function onEndPlay_() {
  logger.info('session:onEndPlay_');
  $root.addClass(CLASSES.PAUSED);
  $root.removeClass(CLASSES.PLAYING);
}

function onSeekEnd_() {
  logger.info('session:onSeekEnd_');
  $root.addClass(CLASSES.PAUSED);
  $root.removeClass(CLASSES.PAUSED + ' ' + CLASSES.FINISHED);
  setTimestamp_();
}

/**
 * Callback for handling when the playback of the sketch is complete.
 */
function onPlaybackComplete_() {
  logger.info('session:onPlaybackComplete_');
  $root.addClass(CLASSES.FINISHED);
  $root.removeClass(CLASSES.PLAYING + ' ' + CLASSES.PAUSED);
}

/**
 * Pause session and ensure history URL is correct when artist modal is opened.
 * @private
 */
function handleArtistOpen_() {
  if (sketchPlayer) {
    wasPlaying = sketchPlayer.sketch.isPlaying();
    sketchPlayer.pause();
  }

  history.pushState(null, null, BIO_HASH);
}

/**
 * Play session and reset URL when user closes modal.
 * @private
 */
function handleArtistClose_() {
  history.pushState(null, null, window.location.pathname);
  if (wasPlaying && sketchPlayer) {
    sketchPlayer.play();
  }
}

/**
 * TODO: Toggle view of video when view screen has been clicked.
 */
function togglePov() {
  sketchPlayer.sketch.togglePOV();
}

export { init };
