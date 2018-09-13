describe("configuration", function() {

  it("loads without error", function(){

    expect(function() {
      require('../../config');
    }).not.toThrow();

  });

  it("connects to redis", function(done){

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