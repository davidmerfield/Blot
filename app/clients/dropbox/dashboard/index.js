var Express = require('express');
var middleware = require('./middleware');
var dashboard = Express.Router();

dashboard
  .use(middleware.load_dropbox_account)
  .get('/', function (req, res) {
    res.render(__dirname + '/views/index.html', {title: 'Dropbox', subpage_title: 'Folder'});
  })
  .get('/change-permission', function (req, res) {
    res.locals.breadcrumbs.add('Change permission', 'change-permission');
    res.render(__dirname + '/views/change_permission.html', {title: 'Dropbox', subpage_title: 'Folder'});
  })
  .use('/select-folder', require('./select_folder'))
  .use('/authenticate', require('./authenticate'))
  .get('/disconnect', function (req, res) {
    res.render(__dirname + '/views/disconnect.html', {title: 'Disconnect from Dropbox'});
  })
  .post('/disconnect', require('./disconnect'));

module.exports = dashboard;