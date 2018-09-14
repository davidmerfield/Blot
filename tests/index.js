var Jasmine = require('jasmine');
var jasmine = new Jasmine();
var config = {
  "spec_dir": "",
  "spec_files": ["tests/**/*.js","app/converters/**/tests/**/*.js"],
  "helpers": [
  ],
  "stopSpecOnExpectationFailure": false,
  "random": true
};

// Pass in a custom test glob for running only specific tests
if (process.env.TEST) {

  console.log('Running', process.env.TEST);
  config.spec_files = [process.env.TEST + "**/*.js"];
}

jasmine.loadConfig(config);

jasmine.addReporter({onComplete:function(passed) {
        if(passed) {
console.log('AFTER PASSED!');
        }
        else {
console.log('AFTER FAILED!');
        }
    }});

  global.createUser = require('./helpers/createUser');
  global.createBlog = require('./helpers/createBlog');

  global.removeBlog = require('./helpers/removeBlog');
  global.removeUser = require('./helpers/removeUser');

if (process.env.SWITCH_DB) {

  var now = Date.now() + '';

  require('../scripts/db/save')(now, function(err){

    if (err) throw err;
    console.log('Saved existing db');

    require('../scripts/db/load')('no_user_but_with_templates', function(err){
  
      if (err) throw err;
      console.log('Loaded empty db');

      jasmine.execute(function(){

        console.log('tests too?');

      }, function(){

        console.log('Finished tests');

        require('../scripts/db/load')(now, function(err){

            if (err) throw err;
            console.log('Restored db');
        });
      });
    });
  });

} else {
  jasmine.execute();
}

