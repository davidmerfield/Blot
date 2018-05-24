var middleware = {};

middleware.render = require('./render');
middleware.load_dropbox_account = require('./load_dropbox_account');
middleware.set_view_directory = require('./set_view_directory');

module.exports = middleware;