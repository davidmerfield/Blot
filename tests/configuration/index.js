var client = require('../../app/models/client');
var config = require('../../config');

describe("configuration", function() {

  it("connects to redis", function(done){

    client.get('hey', function (err) {
      expect(err).toBe(null);
      done();
    });
  });
});