var extend = require("helper/extend");
var _ = require("lodash");

module.exports = function init(DEFAULT) {
  return function (req, res, next) {
    res.locals = res.locals || {};
    res.locals.partials = res.locals.partials || _.cloneDeep(DEFAULT) || {};

    function addLocals(locals) {
      extend(locals).and(_.cloneDeep(res.locals || {}));

      res.locals = locals;
    }

    function addPartials(partials) {
      extend(partials).and(_.cloneDeep(res.locals.partials || {}));

      res.locals.partials = partials;
    }

    res.addLocals = addLocals;
    res.setLocals = addLocals;

    res.addPartials = addPartials;
    res.setPartials = addPartials;

    return next();
  };
};
