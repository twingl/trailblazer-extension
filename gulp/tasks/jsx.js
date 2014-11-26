/* jsx task
   ---------------
   Compile components from node_modules/app/src with jsx

   See browserify.bundleConfigs in gulp/config.js
*/
var config       = require('../config').jsx;
var gulp         = require('gulp');
var jsx          = require('gulp-jsx');

var ENV = process.env.NODE;

gulp.task('jsx', function() {
  return gulp.src(config.src)
    .pipe(jsx())
    .pipe(gulp.dest(config.dest));
});

