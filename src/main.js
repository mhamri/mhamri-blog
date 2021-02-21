// This is the main.js file. Import global CSS and scripts here.
// The Client API can be used here. Learn more: gridsome.org/docs/client-api
require('gridsome-plugin-remark-prismjs-all/themes/night-owl.css');
require('~/main.css');

import DefaultLayout from '~/layouts/Default.vue';

export default function(Vue, { router, head, isClient }) {
  // Set default layout as a global component
  Vue.component('Layout', DefaultLayout);

  head.htmlAttrs = { lang: 'en', class: 'h-full' };
  head.bodyAttrs = { class: 'antialiased font-serif' };

  head.link.push({
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
  });

  if (process.env.NODE_ENV !== 'development') {
    head.script.push({
      src: 'https://www.googletagmanager.com/gtag/js?id=G-L5WBEDZ0LT',
      async: true
    });
    head.script.push({
      innerHTML: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-L5WBEDZ0LT');
      `
    });
  }
}
