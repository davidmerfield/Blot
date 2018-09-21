describe("git", function() {
  // Set up tests
  beforeEach(global.createUser);
  beforeEach(global.createBlog);
  beforeEach(require("./util/startServer"));
  beforeEach(require("./util/cleanDataDirectory"));

  // Tear down
  afterEach(require("./util/cleanDataDirectory"));
  afterEach(require("./util/stopServer"));
  afterEach(global.removeUser);
  afterEach(global.removeBlog);
  afterEach(require("./util/disconnect"));
  
  // Test suites
  require("./authenticate");
  require("./create");
  require("./sync");
  require("./write");
  require("./remove");
});
