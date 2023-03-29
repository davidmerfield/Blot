var zopfli = require("node-zopfli");

const fs = require("fs-extra");

module.exports = async function compress(path) {
  fs.createReadStream(path)
    .pipe(
      zopfli.createGzip({
        verbose: false,
        verbose_more: false,
        numiterations: 15,
        blocksplitting: true,
        blocksplittinglast: false,
        blocksplittingmax: 15,
      })
    )
    .pipe(fs.createWriteStream(path + "gzip"));
};
