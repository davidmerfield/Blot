// Docs
// https://rawgit.com/Marak/faker.js/master/examples/browser/index.html

var sharp = require("sharp");
var fake = require("faker");
var join = require("path").join;

// Ensure we can reproduce fake data
fake.seed(Math.floor(Math.random() * 1000));

fake.pngBuffer = () =>
  sharp({
    create: {
      width: 400,
      height: 400,
      channels: 4,
      background: "#f00",
    },
  })
    .png()
    .toBuffer();

fake.path = function path(ext) {
  var res = [];
  var len = 1 + Math.floor(Math.random() * 10);

  while (res.length < len) {
    res.push(fake.random.word());
  }

  if (ext) res[res.length - 1] += ext;

  // would be nice to remove this
  return "/" + join.apply(this, res);
};

fake.image = function () {
  return sharp({
    create: {
      width: 48,
      height: 48,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 0.5 },
    },
  })
    .png()
    .toBuffer();
};

fake.file = function (options) {
  options = options || {};

  var res = "";

  res += "# " + (options.title || fake.lorem.word()) + "\n\n";

  res += fake.lorem.paragraphs();

  return res;
};

module.exports = fake;
