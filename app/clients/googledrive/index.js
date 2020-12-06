module.exports = {
  display_name: "Google Drive",
  description:
    "Google Drive is a file storage and synchronization service developed by Google.",
  // disconnect: require("./disconnect"),
  // remove: require("./remove"),
  // write: require("./write"),
  site_routes: require("./routes").site,
  dashboard_routes: require("./routes").dashboard
};



// eventually host this on blot.dev once I move it from blot.development
// google refuses to allow a fake tld (.development) in their redirect URIs
const app = new require('express')();
app.use(function(req, res, next){
  res.locals.base = '/clients/googledrive';

  res.render = function(view){
    res.send(require('mustache').render(require('fs').readFileSync(__dirname + '/views/' + view + '.html', 'utf-8'), res.locals));
  };
  next();
});
app.use('/clients/googledrive', require("./routes").dashboard);
app.listen(8822);
// end of shim