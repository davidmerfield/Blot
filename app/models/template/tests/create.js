describe("template", function() {
  require("./setup")();

  var create = require("../create");

  it("creates a template", function(done) {
    create(this.blog.id, this.fake.random.word(), {}, done);
  });

  it("creates a template whose name contains a slash", function(done) {
    var name = this.fake.random.word() + "/" + this.fake.random.word();
    create(this.blog.id, name, {}, function(err, template) {
      expect(err).toBeNull();
      expect(template.id).toEqual(jasmine.any(String));
      done();
    });
  });

  it("returns an error if you try to create a template with no name", function(done) {
    create(this.blog.id, null, null, function(err) {
      expect(err instanceof TypeError).toBe(true);
      done();
    });
  });

  it("returns an error if you try to create a template which already exists", function(done) {
    var name = this.fake.random.word();
    var test = this;
    create(this.blog.id, name, {}, function(err) {
      if (err) return done.fail(err);
      create(test.blog.id, name, {}, function(err) {
        expect(err instanceof Error).toEqual(true);
        done();
      });
    });
  });

  it("creates a template from an existing template", function(done) {
    var test = this;
    var blogID = test.blog.id;
    var original = this.fake.random.word();
    var cloned = this.fake.random.word();
    var description = this.fake.random.word();

    create(blogID, original, { description: description }, function(
      err,
      originalTemplate
    ) {
      if (err) return done.fail(err);

      create(blogID, cloned, { cloneFrom: originalTemplate.id }, function(
        err,
        clonedTemplate
      ) {
        if (err) return done.fail(err);

        expect(originalTemplate.description).toEqual(
          clonedTemplate.description
        );
        done();
      });
    });
  });

  it("returns an error if you try to clone a template that does not exist", function(done) {
    create(
      this.blog.id,
      this.fake.random.word(),
      { cloneFrom: this.fake.random.word() },
      function(err) {
        expect(err instanceof Error).toBe(true);
        done();
      }
    );
  });
});
