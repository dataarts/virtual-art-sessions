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
var ENVIRONMENTS = require('../environments');
var PATHS = require('../paths');

var autoprefixer = require('gulp-autoprefixer');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

module.exports = function(gulp) {
  return function(callback) {
    const isDev = process.env.GULP_ENV === ENVIRONMENTS.DEV;
    var sassOpts;

    if (isDev) {
      sassOpts = {
        outputStyle: 'expanded'
      };
    } else {
      sassOpts = {
        outputStyle: 'compressed'
      };
    }

    return gulp.src(PATHS.CSS_SOURCES)
      .pipe(gulpif(isDev, sourcemaps.init()))
        .pipe(sass(sassOpts).on('error', sass.logError))
        .pipe(autoprefixer({
          browsers: ['last 2 versions', 'IE >= 9', '> 1%']
        }))
      .pipe(gulpif(isDev, sourcemaps.write()))
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest(PATHS.DIST.CSS));
  };
};
