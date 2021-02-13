const tailwind = require('tailwindcss');
const purgeCss = require('@fullhuman/postcss-purgecss');
const autoPrefixer = require('autoprefixer');

const postcssPlugins = [tailwind()];

if (process.env.NODE_ENV === 'production') {
  postcssPlugins.push(purgeCss(require('./purgecss.config.js')));
  postcssPlugins.push(autoPrefixer());
}

const siteInfo = {
  name: 'Mohammad Hossein Amri',
  description: 'Mohammad Hossein Amri technical blog',
  url: 'https://mhamri.com',
  language: 'en'
};

module.exports = {
  siteName: siteInfo.name,
  siteDescription: siteInfo.description,
  siteUrl: siteInfo.url,
  titleTemplate: `%s | ${siteInfo.name}`,
  icon: 'src/favicon.png',

  transformers: {
    remark: {
      externalLinksTarget: '_blank',
      externalLinksRel: ['nofollow', 'noopener', 'noreferrer'],
      anchorClassName: 'icon icon-link',
      plugins: ['gridsome-plugin-remark-prismjs-all', 'remark-hint']
    }
  },
  plugins: [
    // source md
    {
      use: '@gridsome/source-filesystem',
      options: {
        path: './content/posts/**/*.md',
        typeName: 'Post',
        refs: {
          tags: {
            typeName: 'Tag',
            create: true
          },
          author: {
            typeName: 'Author',
            create: true
          }
        }
      }
    },
    // plugin critical
    {
      use: '@gridsome/plugin-critical',
      options: {
        paths: ['/'],
        width: 1300,
        height: 900
      }
    },
    // google analytics
    {
      use: '@gridsome/plugin-google-analytics',
      options: {
        id: 'G-L5WBEDZ0LT'
      }
    },
    // rss
    {
      use: '@microflash/gridsome-plugin-feed',
      options: {
        contentTypes: ['Post'],
        feedOptions: {
          description: siteInfo.description,
          link: siteInfo.url,
          language: siteInfo.language
        },
        feedItemOptions: node => ({
          title: node.title,
          description: node.description,
          link: siteInfo.url + node.path,
          date: node.date,
          image: node.cover
        })
      }
    },
    //sitemap
    {
      use: '@gridsome/plugin-sitemap'
    },
    // robot
    {
      use: 'gridsome-plugin-robots-txt'
    }
  ],
  templates: {
    Post: '/:title',
    Tag: '/tag/:id',
    Author: '/author/:id'
  },
  css: {
    loaderOptions: {
      postcss: {
        plugins: postcssPlugins
      }
    }
  }
};
