describe("blog", function() {

  var Blog = require('../../app/models/blog');
  var test_uid;

  beforeEach(function(done){
  
    var User = require('../../app/models/user');

    User.create('XXXXX@gmail.com', 'XXXX', {}, function(err, user){
      if (err) return done(err);
      test_uid = user.uid;
      done()
    });
  });

  afterEach(function(done){

    var User = require('../../app/models/user');

    User.remove(test_uid, done);
  });

  it("creates and deletes a blog", function(done){

    Blog.create(test_uid, {}, function(err, blog){
      
      expect(err).toBe(null);
      expect(blog).toEqual(jasmine.any(Object));
      done();
    });

  });

});