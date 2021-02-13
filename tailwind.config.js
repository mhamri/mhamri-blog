module.exports = {
  purge: ['./src/**/*.vue', './src/**/*.js', './src/**/*.jsx', './src/**/*.html', './src/**/*.pug', './src/**/*.md'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif']

      // serif: ["Inter", "sans-serif"],

      // mono: ["Inter", "sans-serif"],

      // display: ["Inter", "sans-serif"],

      // body: ["Inter", "sans-serif"],
    },

    extend: {}
  },
  variants: {
    extend: {}
  },
  plugins: []
};
