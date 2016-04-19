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
var watchify = require('watchify');

module.exports = function() {
  return function() {
    var props = {
      debug: true,
      entries: [PATHS.SRC.JS + 'index.js'],
      fullPaths: true,
      insertGlobalVars: {
        jQuery: function() {
          return 'require("jquery")';
        }
      },
      standalone: 'vart',
      transform: [
        [
          'babelify', {
            compact: false,
            presets: ['es2015'],
            plugins: ['add-module-exports']
          }
        ]
      ]
    };
    var opts = assign({}, watchify.args, props);
    var bundler = watchify(browserify(opts));

    function rebundle() {
      return bundler
        .bundle()
        .on('error', onError)
        .pipe(source('vart.js'))
        .pipe(gulp.dest(PATHS.DIST.JS));
    }

    bundler.on('update', function() {
      rebundle();
      gutil.log('Rebundle...');
    });

    return rebundle();
  };
};
