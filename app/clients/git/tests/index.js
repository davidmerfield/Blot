describe("git", function() {


  // Set test git client server to simulate its
  // mounting on the dashboard
  beforeEach(require("./util/startServer"));

  beforeEach(global.createUser);
  beforeEach(global.createBlog);

  // Test clients write here, it is cleaned after
  beforeEach(require("./util/cleanTestDataDirectory"));

  // Test suites
  require("./authenticate");
  require("./create");
  require("./sync");
  require("./write");
  require("./remove");

  // Tear down, which appears to happen in reverse order
  afterEach(require("./util/stopServer"));

  afterEach(require("./util/cleanTestDataDirectory"));

  afterEach(global.removeUser);

  afterEach(global.removeBlog);

  afterEach(require("./util/disconnect"));
});
