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

var debug = require('gulp-debug');
var sassLint = require('gulp-sass-lint');

module.exports = function(gulp) {
  return function() {
    var files = PATHS.CSS_SOURCES.concat([
      '!static/src/sass/vendor/**/*.scss'
    ]);

    return gulp.src(files)
      // .pipe(debug({'title': 'scss-lint'}))
      .pipe(sassLint())
      .pipe(sassLint.format())
      .pipe(sassLint.failOnError())
  };
};
