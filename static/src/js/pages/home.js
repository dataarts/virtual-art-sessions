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
import * as modals from '../components/modals';

const HOME_MENU_TRANSITION_DURATION = 1100;
const HASHES = {
  'ARTISTS': '#/artists',
  'TECH': '#/tech'
};

const $body = $('body');

/**
 * Initialize components on the page.
 */
function init() {
  initCTA_();
  initTechButton_();
  initViewer_();
}

/**
 * Setup event binding for "Get Started" CTA.
 * @private
 */
function initCTA_() {
  var $btn = $('.js-start-cta');

  detectHash_();
  $(window).on('popstate', detectHash_);

  $btn.on('click', function() {
    $body.addClass('before-visible');
    $('.home__info').hide();
    $body.addClass('show-menu');
    history.pushState(null, null, HASHES.ARTISTS);
  });
}

/**
 * Initialise tech button and handle deeplink.
 * @private
 */
function initTechButton_() {
  var $btn = $('[data-modal-trigger="tech"]');
  $btn.on('click', function() {
    history.pushState(null, null, HASHES.TECH);
    detectHash_();
  });
  modals.get('tech').$close.on('click', function() {
    history.pushState(null, null, HASHES.ARTISTS);
    detectHash_();
  });
}

/**
 * Detect whether page has #artist hash and show/hide artist selction element
 * depending on the result.
 */
function detectHash_() {
  if (window.location.hash === HASHES.ARTISTS) {
    if (modals.get('tech').isOpen) {
      modals.get('tech').close();
    }

    $body.addClass('before-visible');
    $('.home__info').hide();
    $body.addClass('show-menu');
    return;
  }

  if (window.location.hash === HASHES.TECH) {
    modals.get('tech').open();
    return;
  }

  $body.removeClass('before-visible show-menu');

  $('.home__info').show();
}

/**
 * Initialize the background artwork viewer.
 */
function initViewer_() {
  const engine = Engine.create();
  const viewer = App.create(engine);

  if (window.location.hash === HASHES.ARTISTS) {
    setTimeout(function () {
      loadViewer_(viewer);
    }, HOME_MENU_TRANSITION_DURATION)
  } else {
    loadViewer_(viewer);
  }
}

function loadViewer_(viewer) {
  var $viewerWrapper = $('.js-viewer-container');

  viewer
    .load('kr_starcatcher_intro')
    .then(sketch => {
      sketch.togglePOV();
      sketch.pause();
      sketch.seek(0.0);
      sketch.play();

      // loop playback
      viewer.events.playbackComplete.add(function() {
        sketch.seek(0.0);
        sketch.play();
      })

      $viewerWrapper.addClass('is-loaded');
    });

  $('.js-viewer').append($(viewer.domElement()));
}

export { init };
