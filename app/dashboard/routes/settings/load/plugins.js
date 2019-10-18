var Mustache = require("mustache");
var _ = require("lodash");
var pluginList = require("../../../../build/plugins").list;
var helper = require("helper");
var capitalise = helper.capitalise;
var deCamelize = helper.deCamelize;

module.exports = function(req, res, next) {
  var blog = req.blog;

  var plugins = _.cloneDeep(pluginList);

  for (var i in plugins) {
    // should not be able to disable this plugin...
    // MUST BE CLONED >.>
    if (!plugins[i].optional) {
      delete plugins[i];
      continue;
    }

    if (!blog.plugins[i]) {
      console.log("Plugin not found: " + i);
      continue;
    }

    var formHTML = plugins[i].formHTML;
    var options = blog.plugins[i].options;

    if (plugins[i].formHTML)
      plugins[i].formHTML = Mustache.render(formHTML, options);

    if (blog.plugins[i] && blog.plugins[i].enabled)
      plugins[i].checked = "checked";
  }

  var categories = {};

  var change = {
    External: "Services"
  };

  plugins = helper.arrayify(plugins, function(plugin) {
    var name = capitalise(deCamelize(plugin.category || "general"));
    var slug = name
      .split(" ")
      .join("-")
      .toLowerCase();

    if (change[name]) name = change[name];

    categories[name] = categories[name] || {
      name: name,
      plugins: [],
      slug: slug,
      url: "/plugins/" + slug
    };

    if (categories[name].plugins.length % 3 === 0) {
      plugin.clear = true;
    }

    categories[name].plugins.push(plugin);
  });

  // categories = helper.arrayify(categories);

  // var _categories = categories.slice();
  //     categories = [];

  // for (var x in _categories) {
  //   _categories[x].plugins[_categories[x].plugins.length -1].last = true;
  //   if (_categories[x].slug === 'typography') {
  //     categories.unshift(_categories[x]);
  //   } else {
  //     categories.push(_categories[x]);
  //   }
  // }

  res.locals.categories = categories;

  return next();
};
