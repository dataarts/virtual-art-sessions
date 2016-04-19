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
var PATHS = require('../paths');

var del = require('del');
var gulp = require('gulp');
var merge = require('merge-stream');
var path = require('path');

module.exports = function() {
  return {
    images: function() {
      return gulp.src(path.join(PATHS.SRC.IMG, '**', '*'))
        .pipe(gulp.dest(PATHS.DIST.IMG));
    },
    js: function() {
      // Third party (non node) deps.
      var vendorScripts = [
        path.join(PATHS.SRC.JS, 'third_party', 'dat-gui', 'dat.gui.min.js'),
        path.join(PATHS.SRC.JS, 'third_party', 'modernizr-custom.js')
      ];

      var thirdParty = gulp
        .src(vendorScripts)
        .pipe(gulp.dest(path.join(PATHS.DIST.JS, 'third_party')));

      // Google Analytics CSP compliant script
      ga = gulp
        .src(path.join(PATHS.SRC.JS, 'gaw.js'))
        .pipe(gulp.dest(PATHS.DIST.JS));

      return merge(thirdParty, ga);
    },
    fonts: function() {
      return gulp.src(path.join(PATHS.SRC.FONTS, '**', '*'))
        .pipe(gulp.dest(PATHS.DIST.FONTS));
    }
  }
}
