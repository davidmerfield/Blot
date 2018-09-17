var get = require('./get');
var helper = require('helper');
var ensure = helper.ensure;
var set = require('./set');

// Removes the entry from the list of links in the header
module.exports = function dropFromMenu (blogID, entry, callback) {

  ensure(blogID, 'string')
    .and(entry, 'object')
    .and(callback, 'function');

  get({id: blogID}, function(err, blog){

    var menu = blog.menu;

    if (!menu || !menu.length)
      return callback();

    var i = menu.length;

    while (i--) {
      if (menu[i].id == entry.id) {
        menu.splice(i, 1);
      }
    }

    set(blogID, {menu: menu}, function(errors){

      if (errors && errors.menu)
        return callback(errors.menu);

      return callback();
    });
  });
};