var moment = require("moment");

module.exports = function(req, res, next) {
  res.locals.date = function() {
    return function(text, render) {
      try {
        text = text.trim();
        text = moment.utc(Date.now()).format(text);
      } catch (e) {
        text = "";
      }

      if (render) return render(text);

      return text;
    };
  };

  next();
};
