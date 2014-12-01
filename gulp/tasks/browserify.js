/* browserify task
   ---------------
   Bundle javascripty things with browserify!

   This task is set up to generate multiple separate bundles, from
   different sources, and to use Watchify when run from the default task.

   See browserify.bundleConfigs in gulp/config.js
*/
var argv         = require('yargs').argv;
var browserify   = require('browserify');
var buffer       = require('vinyl-buffer');
var bundleLogger = require('../util/bundleLogger');
var config       = require('../config').browserify;
var gulp         = require('gulp');
var gulpif       = require('gulp-if');
var handleErrors = require('../util/handleErrors');
var size         = require('gulp-size');
var source       = require('vinyl-source-stream');
var uglify       = require('gulp-uglify');
var watchify     = require('watchify');

var ENV = process.env.NODE;

//Note remove gulp jsx

gulp.task('browserify', [], function(callback) {
  var bundleQueue = config.bundleConfigs.length;
  var index = 0;

  var browserifyThis = function(index) {
    var bundleConfig = config.bundleConfigs[index];

    var bundler = browserify({
      // Required watchify args
      cache: {}, packageCache: {}, fullPaths: true,
      // Specify the entry point of your app
      entries: bundleConfig.entries,
      // Add file extentions to make optional in your requires
      extensions: config.extensions,
      // Enable source maps!
      debug: config.debug
    });

    var bundle = function() {
      // Log when bundling starts
      bundleLogger.start(bundleConfig.outputName);

      return bundler
        .bundle()
        // Report compile errors
        .on('error', handleErrors)
        // Use vinyl-source-stream to make the
        // stream gulp compatible. Specifiy the
        // desired output filename here.
        .pipe(source(bundleConfig.outputName))
        .pipe(buffer())
        // accepts two ways of flagging for production
        .pipe(gulpif((argv.production || ENV === 'production'), uglify()))
        .pipe(size())
        // Specify the output destination
        .pipe(gulp.dest(bundleConfig.dest))
        .on('end', finished);
    };

    if(global.isWatching) {
      // Wrap with watchify and rebundle on changes
      bundler = watchify(bundler);
      // Rebundle on update
      bundler.on('update', bundle);
    }

    var finished = function() {
      // Log when bundling completes
      bundleLogger.end(bundleConfig.outputName)

      index++;
      if(index < bundleQueue) {
        browserifyThis(index)
      } else {
        // If queue is empty, tell gulp the task is complete.
        // https://github.com/gulpjs/gulp/blob/master/docs/API.md#accept-a-callback
        callback();
      }
    };

    return bundle();
  };

  // Start bundling with Browserify for each bundleConfig specified
  browserifyThis(index)
});
