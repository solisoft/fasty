module.exports = {
  npm: {
    globals: {
      $: 'jquery',
      jQuery: 'jquery',
      riot: "riot",
      route: "riot-route",
      prettyBytes: "pretty-bytes"
    },
    styles: {
      select2: ['dist/css/select2.css'],
    }
  },
  hooks: {
    preCompile: (end) => {
      end();
    }
  },
  files: {
    javascripts: {
      joinTo: {
        'js/js.js': /^app\/[js|widgets]/,
        'js/vendors.js': [/^(?!app)/, /^app\/vendors/ ],
      }
    },
    stylesheets: {
      joinTo: {
        'css/css.css': /^app\/[css]/,
        'css/vendors.css': [/^(?!app)/, /^app\/vendors/],
      },
    },
  },
  plugins: {
    htmlPages: {
      compileAssets: true
    }
  },

  overrides: {
    production: {
      paths: {
        public: 'dist'
      }
    }
  }

};