var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var concat = require('gulp-concat');
var handleErrors = require('../util/handleErrors');
var config = require('../config').sass;

// , ['images'],

gulp.task('sass', function () {
  return gulp.src(config.src)
    // .pipe(sass({
    //   compass: true,
    //   bundleExec: true,
    //   sourcemap: true,
    //   sourcemapPath: '../sass'
    // }))
    // .on('error', handleErrors)
    .pipe(concat('style.css'))
    .pipe(gulp.dest(config.dest));
});