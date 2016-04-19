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

var assign = require('lodash.assign');
var babelify = require('babelify');
var browserify = require('browserify');
var gulp = require('gulp');
var gutil = require('gulp-util');
var onError = require('../utils/on-error');
var source = require('vinyl-source-stream');

module.exports = function() {
  return function() {
    var props = {
      debug: false,
      entries: [PATHS.SRC.JS + 'index.js'],
      fullPaths: false,
      insertGlobalVars: {
        jQuery: function() {
          return 'require("jquery")';
        }
      },
      standalone: 'vart',
      transform: [
        [
          'babelify', {
            compact: true,
            presets: ['es2015'],
            plugins: ['add-module-exports']
          }
        ]
      ]
    };
    var opts = assign({}, props);
    var bundler = browserify(opts);
    var stream = bundler.bundle();

    return stream
      .on('error', onError)
      .pipe(source('vart.js'))
      .pipe(gulp.dest(PATHS.DIST.JS));
  };
};
