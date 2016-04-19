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
 module.exports = PATHS = {
  NPM: './node_modules/',
  DIST: {
    ROOT: './static/dist/',
    CSS: './static/dist/css/',
    JS: './static/dist/js/',
    IMG: './static/dist/img/',
    FONTS: './static/dist/fonts/'
  },
  SRC: {
    ROOT: './static/src/',
    SCSS: './static/src/sass/',
    IMG: './static/src/img/',
    JS: './static/src/js/',
    FONTS: './static/src/fonts/'
  },
  TMP: './.tmp/'
};

PATHS.CSS_SOURCES = [
  PATHS.SRC.SCSS + '/**/*.scss'
];

PATHS.JS_SOURCES = [
  PATHS.SRC.JS + '**/*.js',
  '!' + PATHS.SRC.JS + 'viewer/**/*',
  '!' + PATHS.SRC.JS + 'vendor/**/*'
];
