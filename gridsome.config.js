const tailwind = require("tailwindcss");
const purgecss = require("@fullhuman/postcss-purgecss");

const postcssPlugins = [tailwind()];

if (process.env.NODE_ENV === "production")
  postcssPlugins.push(purgecss(require("./purgecss.config.js")));

module.exports = {
  siteName: "Mohammad Hossein Amri",
  siteDescription: "Mohammad Hossein Amri technical blog",
  siteUrl: "https://mhamri.com",
  titleTemplate: `%s | Mohammad Hossein Amri`,
  icon: "src/favicon.png",

  transformers: {
    remark: {
      externalLinksTarget: "_blank",
      externalLinksRel: ["nofollow", "noopener", "noreferrer"],
      anchorClassName: "icon icon-link",
      plugins: ["gridsome-plugin-remark-prismjs-all"],
    },
  },
  plugins: [
    {
      use: "@gridsome/source-filesystem",
      options: {
        path: "./content/posts/**/*.md",
        typeName: "Post",
        refs: {
          tags: {
            typeName: "Tag",
            create: true,
          },
          author: {
            typeName: "Author",
            create: true,
          },
        },
      },
    },
    {
      use: "@gridsome/plugin-critical",
      options: {
        paths: ["/"],
        width: 1300,
        height: 900,
      },
    },
  ],
  templates: {
    Post: "/:title",
    Tag: "/tag/:id",
    Author: "/author/:id",
  },
  css: {
    loaderOptions: {
      postcss: {
        plugins: postcssPlugins,
      },
    },
  },
};
