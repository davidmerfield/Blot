module.exports = function ({ path, mimeType, minify = false }, callback) {
  if (!minify) return callback();

  callback();
};

async function minifyHTML (path) {

}

async function minifyJS (path) {

}

async function minifyCSS (path) {
  
}