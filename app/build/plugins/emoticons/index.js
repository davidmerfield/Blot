var twemoji = require("twemoji");

var options = {
  callback: function(icon, options) {
    switch (icon) {
      case "a9": // copyright  ©
      case "ae": // trademark  ®
      case "2122": // team       ™
      case "21a9": // return ↩
        return false;
    }

    return "".concat(options.base, options.size, "/", icon, options.ext);
  }
};

function prerender(html, callback) {
  try {
    html = twemoji.parse(html, options);
  } catch (e) {}

  return callback(null, html);
}

module.exports = {
  title: "Emojis",
  isDefault: false,
  description: "Convert emojis into images",
  category: "Images",
  prerender: prerender
};
