var get = require('./get');
var helper = require('helper');
var ensure = helper.ensure;
var set = require('./set');

module.exports = function addToMenu (blogID, entry, callback) {

  ensure(blogID, 'string')
    .and(entry, 'object')
    .and(callback, 'function');

  var newLink = {
        label: entry.title,
        url: entry.url,
        metadata: entry.metadata,
        id: entry.id
      };

  // We need to fetch freshed menu since it might have changed
  // during the current sync...
  get({id: blogID}, function(err, blog){

    var menu = blog.menu;

    if (!menu || !menu.length) {
      return set(blogID, {menu: [newLink]}, callback);
    }

    for (var i = 0;i < menu.length; i++) {

      if (menu[i].id == entry.id || menu[i].url === entry.url) {
        menu[i] = newLink;
        return set(blogID, {menu: menu}, callback);
      }
    }

    menu.push(newLink);
    return set(blogID, {menu: menu}, callback);
  });
};