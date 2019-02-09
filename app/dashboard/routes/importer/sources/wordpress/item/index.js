var async = require('async');

module.exports = function(item, callback) {
  
  console.log(item);

  // we take the item and write it out.
  // before calling back

};

function remove_caption(content) {
  while (content.indexOf("[caption") > -1) {
    var opening_index = content.indexOf("[caption");
    var remainder = content.slice(opening_index);
    var closing_index = remainder.indexOf("]");

    content =
      content.slice(0, opening_index) +
      content.slice(opening_index + closing_index + 1);
    content = content.split("[/caption]").join("");
  }

  return content;
}
