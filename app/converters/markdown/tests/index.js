describe("markdown converter", function() {

  var fs = require('fs-extra');
  var markdown = require('../index');

  beforeEach(global.createUser);
  beforeEach(global.createBlog);

  afterEach(global.removeBlog);
  afterEach(global.removeUser);

  require('child_process').exec('pandoc -v', function(err, res){
    if (err) throw err;
    console.log('-----------');
    console.log('PANDOC VERSION:', res);
    console.log('-----------');
  });

  function from (path) {

    return function (callback) {      

      var blogDir = process.env.BLOT_DIRECTORY + '/blogs/' + global.blog.id;
      fs.copyFileSync(__dirname + path, blogDir + path);
      var options = {};

      markdown.read(global.blog, path, options, function(err, html, stat){

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

  xit("converts basic markdown", from('/basic-post.txt'));
  it("converts a list", from('/list.txt'));
  it("parses metadata", from('/metadata.txt'));
  xit("autolinks bare uris", from('/bare-uri.txt'));

});