var gulp = require('gulp')
  , argv = require('yargs').argv
  , bump = require('gulp-bump');

gulp.task('version-bump', function() {
  var type = "patch";
  if (argv.minor) {
    type = "minor";
  } else if (argv.major) {
    type = "major";
  }

  return gulp.src("./manifest.json")
    .pipe(bump({ type: type }))
    .pipe(gulp.dest("./"));
});
