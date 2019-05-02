describe("switchBlogID script", function(){

  var switchBlogID = require('../index');

  global.test.blog();

  it("switches the id of a blog", function(done){
    var test = this;
    var newID = Date.now().toString();

    switchBlogID(test.blog.id, newID, function(err){
      if (err) return done.fail(err);

      test.blog.id = newID;
      done();
    });
  });
});