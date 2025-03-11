describe("template", function() {
	require("./setup")({ createTemplate: true });

	var setView = require("../index").setView;
	var getViewByURLPattern = require("../index").getViewByURLPattern;

	it("gets a view from a URL", function(done) {
		var test = this;
		var view = {
			name: test.fake.random.word(),
			urlPatterns: ["/page/:page"]
		};

		setView(test.template.id, view, function(err) {
			if (err) return done.fail(err);
			getViewByURLPattern(test.template.id, "/page/1", function(
				err,
				viewName,
				params
			) {
				if (err) return done.fail(err);
				expect(viewName).toEqual(view.name);
				expect(params).toEqual({ page: "1" });
				done();
			});
		});
	});

	it("gets a view from a URL with a query string", function(done) {
		var test = this;
		var view = {
			name: test.fake.random.word(),
			urlPatterns: ["/apple"]
		};

		setView(test.template.id, view, function(err) {
			if (err) return done.fail(err);
			getViewByURLPattern(test.template.id, "/apple?foo=bar", function(
				err,
				viewName,
                params,
                query
			) {
				if (err) return done.fail(err);
				expect(viewName).toEqual(view.name);
                expect(params).toEqual({});
                expect(query).toEqual({ foo: "bar" });
				done();
			});
		});
	});

	it("gets a view from a URL with a trailing slash", function(done) {
		var test = this;
		var view = {
			name: test.fake.random.word(),
			urlPatterns: ["/apple"]
		};

		setView(test.template.id, view, function(err) {
			if (err) return done.fail(err);
			getViewByURLPattern(test.template.id, "/apple/", function(err, viewName) {
				if (err) return done.fail(err);
				expect(viewName).toEqual(view.name);
				done();
			});
		});
	});

	it("gets a view whose route contains a trailing slash from a URL without", function(done) {
		var test = this;
		var view = {
			name: test.fake.random.word(),
			urlPatterns: ["/apple/"]
		};

		setView(test.template.id, view, function(err) {
			if (err) return done.fail(err);
			getViewByURLPattern(test.template.id, "/apple", function(err, viewName) {
				if (err) return done.fail(err);
				expect(viewName).toEqual(view.name);
				done();
			});
		});
	});

	it("gets a view by multiple urlPatterns", function(done) {
		var test = this;
		var view = {
			name: test.fake.random.word(),
			urlPatterns: ["/page/:page", "/"]
		};

		setView(test.template.id, view, function(err) {
			if (err) return done.fail(err);
			getViewByURLPattern(test.template.id, "/", function(err, viewName) {
				if (err) return done.fail(err);
				expect(viewName).toEqual(view.name);

				getViewByURLPattern(test.template.id, "/page/2", function(err, viewName) {
					if (err) return done.fail(err);
					expect(viewName).toEqual(view.name);
					done();
				});
			});
		});
	});

	it("gets a view by a lowercase URL without slash", function(done) {
	  var test = this;
      var url = test.fake.random.word().toLowerCase();
	  var view = {
	    name: test.fake.random.word(),
	    urlPatterns: [url]
	  };

	  setView(test.template.id, view, function(err) {
	    if (err) return done.fail(err);
	    getViewByURLPattern(test.template.id, url, function(err, viewName) {
	      if (err) return done.fail(err);
	      expect(viewName).toEqual(view.name);
	      done();
	    });
	  });
	});

	it("gets a view by an uppercase URL", function(done) {
	  var test = this;
      var url = "/" + encodeURIComponent(test.fake.random.word().toUpperCase());
	  var view = {
	    name: test.fake.random.word(),
	    urlPatterns: [url]
	  };

	  setView(test.template.id, view, function(err) {
	    if (err) return done.fail(err);
	    getViewByURLPattern(test.template.id, url, function(err, viewName) {
	      if (err) return done.fail(err);
	      expect(viewName).toEqual(view.name);
	      done();
	    });
	  });
	});

	it("returns an error for a non-existent URL", function(done) {
	  var test = this;
	  getViewByURLPattern(test.template.id, "", function(err, viewName) {
	    expect(err instanceof Error).toBe(true);
	    expect(viewName).toBe(null);
	    done();
	  });
	});
});