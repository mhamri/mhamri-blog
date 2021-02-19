module.exports = {
  content: ['./src/**/*.vue', './src/**/*.js', './src/**/*.html', './content/**/*.md', './dist/**/*.html', './dist/**/*.json', './dist/**/*.js'],
  safelist: [
    'body',
    'html',
    'img',
    'a',
    'g-image',
    'g-image--lazy',
    'g-image--loaded',
    /-(leave|enter|appear)(|-(to|from|active))$/,
    /^(?!(|.*?:)cursor-move).+-move$/,
    /^router-link(|-exact)-active$/,
    /data-v-.*/
  ],
  defaultExtractor: content => {
    // const contentWithoutStyleBlocks = content.replace(/<style[^]+?<\/style>/gi, '');
    return content.match(/[A-Za-z0-9-_/:]*[A-Za-z0-9-_/]+/g) || [];
  }
};
