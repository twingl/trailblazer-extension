//OLD GULP FILE !!!!


var gulp        = require('gulp')
  , fs          = require('fs')
  , bump        = require('gulp-bump')
  , filter      = require('gulp-filter')
  , pre         = require('gulp-preprocess')
  , run         = require('gulp-run')
  , util        = require('gulp-util')
  , zip         = require('gulp-zip')
  , dotenv      = require('dotenv')
  , browserify  = require('browserify')
  , source      = require('vinyl-source-stream')
  , buffer      = require('vinyl-buffer')
  , size        = require('gulp-size')
  , uglify      = require('gulp-uglify')
  , gutil       = require('gulp-util');

var locations = {
  src: [
    "./src/{adapter,model,core,lib,ui}/**/*",
    "./src/background.js",
    "./src/manifest.json",
    "./src/delete-icon.svg"
  ],
  releaseDir: "./release",
  build: "./build",
};



// gulp.task('build-map', function() {
//   var bundler = browserify({
//     entries: ['./src/ui/pages/js/src/map.js']
//   })

//   return bundler.bundle()
//     .pipe(source('map.js'))
//     .pipe(buffer())
//     .pipe(uglify())
//     .pipe(size())
//     .pipe(gulp.dest('build/'))
// });

gulp.task('build', function (cb) {
  run('npm run build').exec(cb);
});

gulp.task('version-bump', function() {
  return gulp.src("./src/manifest.json")
      .pipe(bump({ type: "patch" }))
      .pipe(gulp.dest("./"));
});

/**
 * Packages extension into a zip archive ready for deployment on the Chrome Web
 * Store and tags a release in the git repo.
 */
gulp.task('release', ['build', 'version-bump'], function () {
  var manifest = require("./src/manifest.json")
    , versionTag     = "v" + manifest.version
    , versionMessage = "Release: " + versionTag
    , pkgName        = manifest.name.toLowerCase().replace(' ', '-') + "-" + versionTag + ".zip";

  util.log("Committing", versionMessage);
  run("git commit -am \"" + versionMessage + "\"").exec(function(err) {
    if (err) throw err;

    util.log("Tagging", versionTag);
    run("git tag " + versionTag).exec(function(err) {
      if (err) throw err;

      util.log("Packaging", "'" + util.colors.yellow(locations.releaseDir + "/" + pkgName) + "'");

      var backgroundFilter = filter("background.js"); // only pre-process background.js
      return gulp.src(locations.src)
          .pipe(backgroundFilter)
          .pipe(pre({ context: { PRODUCTION: true } }))
          .pipe(backgroundFilter.restore())
          .pipe(zip(pkgName))
          .pipe(gulp.dest(locations.releaseDir));
    });
  });

});
