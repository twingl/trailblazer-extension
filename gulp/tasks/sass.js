var _             = require('lodash')
  , gulp          = require('gulp')
  , merge         = require('merge-stream')
  , sass          = require('gulp-sass')
  , sourcemaps    = require('gulp-sourcemaps')
  , concat        = require('gulp-concat')
  , handleErrors  = require('../util/handleErrors')
  , config        = require('../config').sass;

gulp.task('sass', function () {
  var streams = _.collect(config.bundles, function(bundle) {
    return gulp.src(bundle.src)
      .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(concat(bundle.name))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(bundle.dest));
  });

  return merge(streams);
});
