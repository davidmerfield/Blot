module.exports = function(req, res, next) {

  var _redirect = res.redirect;
  
  res.redirect = function(status, value, message) {

    // Support passing of integer status code
    if (typeof status === "string") {
      value = status;
      status = null;
    }

    if (status) {
      _redirect.call(this, status, value);
    } else {
      _redirect.call(this, value);
    }

    if (message) {

      if (typeof  message === "error") {

      } 

      if (typeof message === "string") {

      }
      
    }

  };

  next();
};
