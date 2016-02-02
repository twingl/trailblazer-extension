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
        src: src + "/style/popup.manifest.scss",
        dest: dest
      },
      {
        name: "main-ui.css",
        src: src + "/style/main-ui.manifest.scss",
        dest: dest
      },
      {
        name: "tour.css",
        src: src + "/style/tour.manifest.scss",
        dest: dest
      }
    ]
  },
  // images: {
  //   src: src + "/images/**",
  //   dest: dest + "/images"
  // },
  markup: {
    src: src + "/markup/**",
    dest: dest
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
        entries: './src/scripts/background.js',
        dest: dest,
        outputName: 'background.js'
      },
      {
        entries: './src/scripts/main-ui.jsx',
        dest: dest,
        outputName: 'main-ui.js'
      },
      {
        entries: './src/scripts/popup.js',
        dest: dest,
        outputName: 'popup.js'
      },
      {
        entries: './src/content-scripts/page-title.js',
        dest: dest,
        outputName: 'page-title.js'
      },
      {
        entries: './src/scripts/public-map.js',
        dest: dest,
        outputName: 'public-map.js'
      },
      {
        entries: './src/scripts/tour.jsx',
        dest: dest,
        outputName: 'tour.js'
      }
    ]
  }
};
