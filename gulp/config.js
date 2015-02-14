var dest = "./build";
var src = './src';

module.exports = {
  release: {
    src: [
      "./build/**/*",
      "./assets/**/*",
      "./manifest.json"
    ],
    dest: "./release/"
  },
  sass: {
    bundles: [
      {
        name: "popup.css",
        src: src + "/style/popup/**/*",
        dest: dest
      },
      {
        name: "content.css",
        src: src + "/style/content/**/*",
        dest: dest
      },
      {
        name: "tour.css",
        src: src + "/style/tour/**/*",
        dest: dest
      }
    ]
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
      },
      {
        entries: './src/popup.js',
        dest: dest,
        outputName: 'popup.js'
      },
      {
        entries: './src/content-scripts/page-title.js',
        dest: dest,
        outputName: 'page-title.js'
      },
      {
        entries: './src/public-map.js',
        dest: dest,
        outputName: 'public-map.js'
      },
      {
        entries: './src/tour.js',
        dest: dest,
        outputName: 'tour.js'
      }
    ]
  }
};
