module.exports = function(server){

  var auth = require('../../authHandler'),
      upload = require('../../upload'),
      bodyParser = require('body-parser'),
      helper = require('../../helper'),
      tempDir = helper.tempDir();

  var rm = helper.remove;

  server.get('/export', auth.enforce, function (request, response) {

    response.addLocals({
      title: "Blot - Export",
      name: 'Export',
      tab: {settings: 'selected'}
    });

    response.render('export');
  });

  server.post('/export', auth.enforce, bodyParser.urlencoded({extended:false}), function(request, response, next){

    var fields = request.body;
    var blogID = request.blog.id;

    var exporter =require('../../exporter/main');

    // No form passed
    if (!fields) return response.redirect('/export');

    var exID = helper.makeUid(6);
    var zipFile = tempDir + exID + '.zip';
    var username = fields.tumblrUsername;

    var options = {
          url: username,
          dir: tempDir + exID
        };

    var uploadOptions = {
      blogID: blogID,
      folder: '/exporter/tumblr'
    };

    exporter(options, function(err){

      if (err) return next(err);

      upload(zipFile, uploadOptions, function(err, finalUrl){

        rm(zipFile);

        if (err) return next(err);

        if (finalUrl) response.status(200).send(finalUrl);
      });
    });
  });
};