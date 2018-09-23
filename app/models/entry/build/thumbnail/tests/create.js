describe("create", function() {

  var create = require("../create");

  // metadata should be at top of queue
  // then the images in the html if there are any 
  // in the order they appear in the post
  it("creates thumbnails", function(done) {
      
    var path = __dirname + '/images/portrait.jpg';

    create(global.blog.id, path, function(err, thumbnails){

      expect(err).toBe(null);
      expect(thumbnails).toEqual(jasmine.any(Object));
      expect(thumbnails.square.width).toEqual(160);
      expect(thumbnails.square.name).toEqual('square-portrait.jpg');
      done();
    });
  });
  
});
