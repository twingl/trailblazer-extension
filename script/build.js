var argv        = require('yargs').argv
  , dotenv      = require('dotenv')
  , rimraf      = require('rimraf')
  , webpack     = require('webpack')
  , config      = require('../webpack.config')

// Load our env configuration before everything
if (argv.production) {
  console.log('Loading production environment');
  dotenv.load({ path: '.env-production' });
} else if (argv.staging) {
  console.log('Loading staging environment');
  dotenv.load({ path: '.env-staging' });
} else {
  console.log('Loading development environment');
  dotenv.load();
}

// Remove the old build output
rimraf('build/**/*', function(err) {
  if (err) console.log('rimraf: Err: ', err);
});

webpack(config, function(err, stats) {
  console.log(stats.toString({
    colors: true,
    chunks: false
  }));
});
