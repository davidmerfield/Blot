module.exports = function ({ path, mimeType, minify = false }, callback) {
  if (!minify) return callback();

  callback();
};

function minifyHTML (path) {

}

function minifyJS (path) {

}

function minifyCSS (path) {
  
}