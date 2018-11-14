console.log('BUILDING TEMPLATES');

var config = require('../../config');
var fs = require('fs');
var helper = require('../../app/helper');
var _ = require('lodash');

var path = require('path');

var APPDIR = path.resolve(__dirname + '/../../app');

var TEMPLATEDIR = APPDIR + '/templates/';

var mime = require('mime');
var Template = require('../../app/models/template.js');
var owner = Template.siteOwner;
var extend = helper.extend;
var forEach = helper.forEach;
var defaultDir = TEMPLATEDIR + '_/';
var defaultInfo = fs.readFileSync(TEMPLATEDIR + '_/package.json', 'utf-8');
    defaultInfo = JSON.parse(defaultInfo);

var watcher = require('watcher');

build();

if (config.environment === 'development') {
  process.stdin.resume();
  console.log('Watching public directory for changes');
  watcher(TEMPLATEDIR, build);
}

function build () {

  // Load templates from disk
  fs.readdir(TEMPLATEDIR, function(err, templates){

    forEach(templates, function(templateName, nextTemplate){

      if (templateName.slice(0, 1) === '.') return nextTemplate();
      if (templateName === '_') return nextTemplate();
      if (templateName === 'readme.txt') return nextTemplate();
      if (templateName === 'README.txt') return nextTemplate();
      if (templateName === 'README.md') return nextTemplate();

      loadFromFolder(TEMPLATEDIR + templateName + '/', templateName, owner, function(err){

        if (err) {
          console.log(templateName)
          throw err;
        }

        console.log('--', templateName,'BUILT FROM FOLDER');
        nextTemplate();

        // console.log(stat);
      });

    }, function(){
      require('../cache/empty')();
      console.log('ALL TEMPLATES BUILT');
    });
  });


  function loadFromFolder (dir, templateName, owner, callback) {

    callback = helper.callOnce(callback);

    var templateID = Template.makeID(owner, templateName);

    Template.isOwner(owner, templateID, function(err, isOwner){

      if (err) return callback(err);

      fs.readFile(dir + 'package.json', 'utf-8', function (err, info){

        if (err || !info) return callback('Please create a package.json containing the template info');

        info = JSON.parse(info);

        extend(info)
          .and(defaultInfo);

        var views = _.cloneDeep(info.views);
            delete info.views;

        if (!info.name) {
          return callback('Please specify the package name');
        }

        if (!isOwner) {
          Template.create(owner, helper.capitalise(templateName), info, then);
        } else {
          Template.update(owner, helper.capitalise(templateName), info, then);
        }

        function then(err) {

          if (err) return callback(err);

          fs.readdir(dir, extractViews(dir));
          fs.readdir(defaultDir, extractViews(defaultDir));

          function extractViews(dir) {

            return function (err, viewFiles){

              if (err) return callback(err);

              var totalToSet = 0;

              viewFiles.forEach(function(viewFilename){

                if (viewFilename.slice(0, 1) === '.') return;
                if (viewFilename === 'package.json') return;

                totalToSet++;

                fs.readFile(dir + viewFilename, 'utf-8', function(err, viewContent){

                  if (err && err.code === 'EISDIR') return;

                  if (err) throw err;

                  var viewName = viewFilename.slice(0, viewFilename.lastIndexOf('.'));

                  var view = {
                    name: viewName,
                    type: mime.lookup(viewFilename),
                    content: viewContent
                  };

                  if (view.name.slice(0, 1) === '_') {
                    view.name = view.name.slice(1);
                  }

                  if (views && views[view.name]) {
                    var newView = views[view.name];
                    extend(newView)
                      .and(view);
                    view = newView;
                  }

                  Template.setView(templateID, view, onSet);
                });

                function onSet (err) {

                  if (err) return callback(err);

                  if (!--totalToSet) callback(null, 'Set template ' + templateID);
                }
              });
            };
          }
        }
      });
    });
  }


}
