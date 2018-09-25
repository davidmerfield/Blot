describe("git", function() {
  
  // Set up client server to simulate its
  // mounting on the dashboard
  beforeAll(require("./util/startServer"));
  afterAll(require("./util/stopServer"));

  beforeEach(global.createUser);
  afterEach(global.removeUser);

  beforeEach(global.createBlog);
  afterEach(global.removeBlog);

  it("runs", function(){
    console.log('INSIDE SPEC with user', this.user.uid, 'and blog', this.blog.handle);
  });

  // Test clients write here, it is cleaned after
  // beforeEach(require("./util/cleanTestDataDirectory"));


  it("works", function(done){
    done();
  });

  // Test suites
  // require("./authenticate");
  // require("./create");
  // require("./sync");
  // require("./write");
  // require("./remove");

  // Tear down, which appears to happen in reverse order

  // afterEach(require("./util/cleanTestDataDirectory"));



  // Do i need this?
  // afterEach(require("./util/disconnect"));
});
