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
import 'babel-polyfill';
const bowser = require('bowser');

import autotrack from './components/autotrack';
import focusmanager from './components/focusmanager';
import * as social from './components/social';
import * as modals from './components/modals';
import * as typekit from './components/typekit';

import * as home from './pages/home';
import * as logger from './utils/logger';
import * as session from './pages/session';
import * as test from './pages/test';

const components = {
  autotrack,
  modals,
  social,
  typekit
};

const pages = {
  home,
  session,
  test
};

/**
 * Initialise page-specific modules. Also initialise components with each of
 * their init functions.
 * @param {string} name The page's name.
 * @param {Object} options Options to pass to page's module.
 */
function init(name, options) {
  const docEl = document.documentElement;

  if (name !== 'unsupported' && !Modernizr.webgl) {
    return window.location.replace('/unsupported');
  }

  if (bowser.msie) {
    docEl.className = docEl.className.concat(' msie');
  }

  for (let component in components) {
    components[component].init();
  }

  if (name && pages[name] && pages[name].init) {
    pages[name].init(options || {});
  }
}

export { init };
