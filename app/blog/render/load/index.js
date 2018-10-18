var Augment = require("./augment");
var eachEntry = require("./eachEntry");

// then we check each entry in the view
// we determine a new list of partials
// and locals to retrieve based on those entries
// and retrieve them
// merging them into the view
// then returning req and res
module.exports = function(blog, locals) {
  var augment = Augment(blog);
  eachEntry(locals, augment);
  return locals;
};
