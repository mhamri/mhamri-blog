const fs = require("fs");
const moment = require("moment");
const slugify = require("@sindresorhus/slugify");

const title = process.argv[2];
const postDate = moment().format("YYYY-MM-DD HH:mm:ss");
const year = moment().format("YYYY");
const slugifyName = slugify(title);
const blogDir = `./content/posts/${year}/${slugifyName}`;

if (!title) {
  console.log("❌  Please specify a post title.");
  return;
}

const fileName = `${moment().format("YYYY-MM-DD")}-${slugifyName}`;

const contents = `---
title: "${title}"
slug: ${slugifyName}
description: "${title}"
date: ${postDate}
author: Mohammad Hossein Amri
tags: [" "]
cover: https://source.unsplash.com/featured/?textures-patterns
fullscreen: false
excerpt: "" 
---
`;

fs.mkdir(blogDir, { recursive: true }, () => {});
fs.writeFile(`${blogDir}/${fileName}.md`, contents, () =>
  console.log(`✔ Created ${blogDir}/${fileName}.md`)
);
