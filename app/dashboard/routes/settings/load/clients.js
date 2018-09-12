var clients = require("clients");
var list = [];

// Build the list of clients for the dashboard
for (var i in clients) {
  list.push({
    name: i,
    display_name: clients[i].display_name,
    description: clients[i].description
  });
}

module.exports = function(req, res, next) {
  res.locals.clients = list.slice();

  res.locals.clients[0].checked = "checked";

  res.locals.clients = list;

  next();
};
