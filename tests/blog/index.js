describe("blog", function() {

  var Blog = require('../../app/models/blog');
  
  global.test.blog();

  it("creates and deletes a blog", function(done){

    Blog.create(this.user.uid, {}, function(err, blog){
      
      expect(err).toBe(null);
      expect(blog).toEqual(jasmine.any(Object));

      Blog.remove(blog.id, function(err){
      
        expect(err).toBe(null);
        done();
      });
    });
  });
});