module.exports = function Breadcrumbs() {
  var list = { items: [] };

  list.add = function(label, slug) {
    var base = "/";

    if (list.items.length) base = list.items[list.items.length - 1].url;

    list.items.push({ label: label, url: require("path").join(base, slug) });

    for (var i = 0; i < list.items.length; i++) {
      list.items[i].first = i === 0;
      list.items[i].last = i === list.items.length - 1;
      list.items[i].only = i === 0 && list.items.length === 1;
    }

    if (list.items.length > 1) list.show = true;
  };

  list.show = false;

  return list;
};
