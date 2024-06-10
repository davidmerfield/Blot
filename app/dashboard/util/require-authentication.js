module.exports = function (req, res, next) {

    res.locals.selected = { dashboard: "selected" };
  
    if (req.session && req.session.uid) {
      return next();
    }
    
    next(new Error("NOUSER"));
  }