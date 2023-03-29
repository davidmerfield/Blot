var zopfli = require("node-zopfli");
const gzip = require("util").promisify(zopfli.gzip);
const fs = require("fs-extra");

module.exports = async function compress(path) {
  const input = await fs.readFile(path);
  const output = await gzip(input, {
    verbose: false,
    verbose_more: false,
    numiterations: 15,
    blocksplitting: true,
    blocksplittinglast: false,
    blocksplittingmax: 15,
  });
  await fs.outputFile(path + "gzip", output);
};
