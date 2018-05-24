var Express = require('express');
var middleware = require('./middleware');
var dashboard = Express.Router();

dashboard
  .use(middleware.set_view_directory)
  .use(middleware.load_dropbox_account)
  .get('/', middleware.render('index'))
  .get('/change-permission', middleware.render('change_permission'))
  .use('/select-folder', require('./select_folder'))
  .use('/authenticate', require('./authenticate'))
  .post('/disconnect', require('./disconnect'));

module.exports = dashboard;