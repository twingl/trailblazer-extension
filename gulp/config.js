var dest = "./build";
var src = './src';

module.exports = {
  // browserSync: {
  //   server: {
  //     // We're serving the src folder as well
  //     // for sass sourcemap linking
  //     baseDir: [dest, src]
  //   },
  //   files: [
  //     dest + "/**",
  //     // Exclude Map files
  //     "!" + dest + "/**.map"
  //   ]
  // },
  // sass: {
  //   src: src + "/sass/*.{sass, scss}",
  //   dest: dest
  // },
  // images: {
  //   src: src + "/images/**",
  //   dest: dest + "/images"
  // },
  // markup: {
  //   src: src + "/htdocs/**",
  //   dest: dest
  // },
  browserify: {
    // Enable source maps
    debug: true,
    // Additional file extentions to make optional
    extensions: [],
    // A separate bundle will be generated for each
    // bundle config in the list below
    bundleConfigs: [
      {
        entries: './src/config.js',
        dest: dest,
        outputName: 'config.js'
      },
      {
        entries: './src/ui/pages/js/map.js',
        dest: dest,
        outputName: 'map.js'
      },
      {
        entries: './src/ui/pages/js/trails.js',
        dest: dest,
        outputName: 'trails.js'
      },
      {
        entries: './src/core/state-manager.js',
        dest: dest,
        outputName: 'state-manager.js'
      },
      {
        entries: './src/background.js',
        dest: dest,
        outputName: 'background.js'
      }
    ]
  }
};
