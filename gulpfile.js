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
var gulp = require('gulp');
var getTask = require('./gulp/utils/get-task');

// Initialise gulp tasks.
var copy = getTask('copy');

gulp.task('browserify', getTask('browserify'));
gulp.task('clean', getTask('clean'));
gulp.task('copy:fonts', copy.fonts);
gulp.task('copy:images', copy.images);
gulp.task('copy:js', copy.js);
gulp.task('lint-js', getTask('lint-js'));
gulp.task('lint-scss', getTask('lint-scss'));
gulp.task('sass', getTask('sass'));
gulp.task('symlink:dev', getTask('symlink').dev);
gulp.task('watch', getTask('watch'));
gulp.task('watchify', getTask('watchify'));

// Main tasks
gulp.task('build', getTask('build'));
gulp.task('default', getTask('default'));
