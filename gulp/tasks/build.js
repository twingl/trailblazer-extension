var gulp = require('gulp');
var argv = require('yargs').argv;
var dotenv = require('dotenv')

//set environment variables from command line with flag '--production'
if (argv.production) {
  dotenv._getKeyAndValueFromLine('./.env-production');
  dotenv._setEnvs();
} else {
  dotenv.load();
}

// gulp.task('build', ['browserify', 'sass', 'images', 'markup']);
gulp.task('build', ['browserify', 'markup']);