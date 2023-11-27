var ERROCODE = "BADTEMPLATE";
var DEFAULT = "Your template was badly formed";

var MESSAGES = {
  NO_BLOG: "This blog does not exist.",
  NO_TEMPLATE: "This template does not exist.",
  NO_VIEW: "This view does not exist.",
  BAD_TEMPLATE: DEFAULT,
  UNCLOSED: "Your template has an unclosed tag",
  BAD_PARTIALS: "Your template partials were badly called",
  BAD_LOCALS: "Your template variables were badly called",
  INFINITE: "Your template has infinitely nested partials",
};

function newErr(message) {
  var error = new Error(message || DEFAULT);
  error.code = ERROCODE;
  return error;
}

for (var i in MESSAGES) newErr[i] = newErr.bind(this, MESSAGES[i]);

module.exports = newErr;
