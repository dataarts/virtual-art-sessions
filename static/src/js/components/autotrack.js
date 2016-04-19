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
import $ from 'jquery';

var script = document.getElementById('analytics');

var onClick_ = function(e) {
  const $link = $(e.currentTarget);
  const category = $link.data('ga-category');
  const action = $link.data('ga-action');
  const label = $link.data('ga-label') || window.location.pathname;

  if (category == undefined || action == undefined) {
    logger.warn('tracker: Both category and action must be defined');
  } else {
    analytics('send', 'event', category, action, label);
  }
};

var autotrack = {
  init: function() {
    $('body').on('click', 'a[data-ga-category],button[data-ga-category]', onClick_);
  }
}

export default autotrack;
