var gulp  = require('gulp')
  , run   = require('gulp-run')
  , util  = require('gulp-util')
  , zip   = require('gulp-zip')
  , config = require('../config').release;

gulp.task('release', ['build', 'version-bump'], function() {

  var manifest = require("../../manifest.json")
    , versionTag     = "v" + manifest.version
    , versionMessage = "Release: " + versionTag
    , pkgName        = manifest.name.toLowerCase().replace(' ', '-') + "-" + versionTag + ".zip";

  util.log("Committing", versionMessage);
  run("git commit -am \"" + versionMessage + "\"").exec(function(err) {
    if (err) throw err;

    util.log("Tagging", versionTag);
    run("git tag " + versionTag).exec(function(err) {
      if (err) throw err;

      util.log("Packaging", "'" + util.colors.yellow(config.dest + pkgName) + "'");

      return gulp.src(config.src, { base: "./" })
          .pipe(zip(pkgName))
          .pipe(gulp.dest(config.dest));
    });
  });

});
