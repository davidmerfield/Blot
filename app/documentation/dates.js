const moment = require("moment");

module.exports = function () {
  return function (text, render) {
    try {
      text = text.trim();
      text = moment.utc(Date.now()).format(text);
    } catch (e) {
      text = "";
    }
    return render(text);
  };
};
