xdescribe("blog", function() {

  var Blog = require('../../app/models/blog');

  it("creates a blog", function(){

    Blog.create({}, function(err, blog){
      expect(err).toBe(null);

    });

  });

  it("deletes a blog", function(done){

    require('../../app/models/client').get('hey', function (err) {
      expect(err).toBe(null);
      done();
    });
  });

  it("loads the main function", function(){

    expect(function() {

      require('../../app');
      
    }).not.toThrow();

  });
});