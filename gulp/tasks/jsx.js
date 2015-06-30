/* jsx task
   ---------------
   Compile components from node_modules/app/src with jsx

   See browserify.bundleConfigs in gulp/config.js
*/
var config       = require('../config').jsx;
var gulp         = require('gulp');
var jsx          = require('gulp-jsx');

gulp.task('jsx', function() {
  return gulp.src(config.src)
    .pipe(jsx({
      jsx: "React.createElement"
    }))
    .pipe(gulp.dest(config.dest));
});

