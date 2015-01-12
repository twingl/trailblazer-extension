var _             = require('lodash')
  , gulp          = require('gulp')
  , merge         = require('merge-stream')
  , sass          = require('gulp-ruby-sass')
  , concat        = require('gulp-concat')
  , handleErrors  = require('../util/handleErrors')
  , config        = require('../config').sass;

// , ['images'],

gulp.task('sass', function () {
  var streams = _.collect(config.bundles, function(bundle) {
    return gulp.src(bundle.src)
      // .pipe(sass({
      //   compass: true,
      //   bundleExec: true,
      //   sourcemap: true,
      //   sourcemapPath: '../sass'
      // }))
      // .on('error', handleErrors)
      .pipe(concat(bundle.name))
      .pipe(gulp.dest(bundle.dest));
  });

  return merge(streams);
});
