const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const cssFolder = './dist/assets/css/';
// find the styles css file
const files = getFilesFromPath(cssFolder, '.css');
let data = [];

if (!files && files.length <= 0) {
  console.log('cannot find style files to purge');
  return;
}

for (let f of files) {
  // get original file size
  const originalSize = getFilesizeInKiloBytes(cssFolder + f) + 'kb';
  var o = { file: f, originalSize: originalSize, newSize: '' };
  data.push(o);
}

console.log('Run PurgeCSS...');

exec('purgecss -c "./purgecss.config.js"', function(error, stdout, stderr) {
  console.log('PurgeCSS done');
  console.log();

  for (let d of data) {
    // get new file size
    const newSize = getFilesizeInKiloBytes(cssFolder + d.file) + 'kb';
    d.newSize = newSize;
  }

  console.table(data);
});

fs.copyFileSync('./_redirects', './dist/_redirects');

function getFilesizeInKiloBytes(filename) {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats.size / 1024;
  return fileSizeInBytes.toFixed(2);
}

function getFilesFromPath(dir, extension) {
  let files = fs.readdirSync(dir, {});
  console.log(files);
  return files.filter(e => path.extname(e).toLowerCase() === extension);
}
