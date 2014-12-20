var dest = "./build";
var src = './src';

module.exports = {
  sass: {
    src: src + "/content/styles/*.css",
    dest: dest
  },
  // images: {
  //   src: src + "/images/**",
  //   dest: dest + "/images"
  // },
  markup: {
    src: src + "/htdocs/**",
    dest: dest
  },
  jsx: {
    src: "./node_modules/app/src/**/*.js",
    dest: "./node_modules/app/components"
  },
  browserify: {
    // Enable source maps
    debug: true,
    // Additional file extentions to make optional
    extensions: [],
    // A separate bundle will be generated for each
    // bundle config in the list below
    bundleConfigs: [
      {
        entries: './src/background.js',
        dest: dest,
        outputName: 'background.js'
      },
      {
        entries: './src/content.js',
        dest: dest,
        outputName: 'content.js'
      }
    ]
  }
};
