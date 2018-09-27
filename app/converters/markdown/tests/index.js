describe("markdown converter", function() {

  var fs = require('fs-extra');
  var markdown = require('../index');
  var helper = require('helper');

  global.test.blog();

  // require('child_process').exec('pandoc -v', function(err, res){
  //   if (err) throw err;
  //   console.log('-----------');
  //   console.log('PANDOC VERSION:', res);
  //   console.log('-----------');
  // });

  function from (path) {

    return function (callback) {      
      fs.copyFileSync(__dirname + path, helper.localPath(this.blog.id, path));
      var options = {};

      markdown.read(this.blog, path, options, function(err, html, stat){

        expect(err).toBe(null);
        expect(stat).toEqual(jasmine.any(Object));

        fs.readFile(__dirname + path +'.html', 'utf-8', function(err, expected){

          expect(err).toBe(null);
          expect(html).toEqual(expected);

          callback();
        });
      });
    };
  }

  it("converts basic markdown", from('/basic-post.txt'));
  it("converts a list", from('/list.txt'));
  it("does not obfuscate an email address", from('/email-addresses.txt'));

  xit("parses metadata", from('/metadata.txt'));
  xit("autolinks bare uris", from('/bare-uri.txt'));

});