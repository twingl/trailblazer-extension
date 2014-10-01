var gulp    = require('gulp')
  , fs      = require('fs')
  , bump    = require('gulp-bump')
  , run     = require('gulp-run')
  , util    = require('gulp-util')
  , zip     = require('gulp-zip');


var locations = {
  src: [
    "./{adapter,model,core,lib,ui}/**/*",
    "./background.js",
    "./manifest.json",
    "./delete-icon.svg"

  ],
  releaseDir: "./release"
};

gulp.task('build', function (cb) {
  run('npm run build').exec(cb);
});

gulp.task('version-bump', function() {
  return gulp.src("./manifest.json")
      .pipe(bump({ type: "patch" }))
      .pipe(gulp.dest("./"));
});

/**
 * Packages extension into a zip archive ready for deployment on the Chrome Web
 * Store and tags a release in the git repo.
 */
gulp.task('release', ['build', 'version-bump'], function () {
  var manifest = require("./manifest.json")
    , versionTag     = "v" + manifest.version
    , versionMessage = "Release: " + versionTag
    , pkgName        = manifest.name.toLowerCase().replace(' ', '-') + "-" + versionTag + ".zip";

  util.log("Tagging", versionTag);
  run("git tag " + versionTag).exec(function(err) { if (err) throw err; });

  util.log("Committing", versionMessage);
  run("git commit -am \"" + versionMessage + "\"").exec(function(err) { if (err) throw err; });

  util.log("Packaging", "'" + util.colors.yellow(locations.releaseDir + "/" + pkgName) + "'");

  return gulp.src(locations.src)
      .pipe(zip(pkgName))
      .pipe(gulp.dest(locations.releaseDir));
});
