describe("candidates", function() {
  var candidates = require("../candidates");

  // metadata should be at top of queue
  // then the images in the html if there are any
  // in the order they appear in the post
  it("finds a thumbnail candidate", function() {
    var metadata = { thumbnail: "http://example.com/image-in-metadata.jpg" };
    var html = '<img src="/first-image.jpg"><img src="/second-image.jpg">';

    expect(candidates(metadata, html)).toEqual([
      "http://example.com/image-in-metadata.jpg",
      "/first-image.jpg",
      "/second-image.jpg"
    ]);
  });

  it("does not find a thumbnail candidate", function() {
    var metadata = {};
    var html = "<p>Hello, World!</p>";

    expect(candidates(metadata, html)).toEqual([]);
  });
});
