describe("template", function() {
	require("./setup")({ createTemplate: true });

	var setView = require("../index").setView;
	var getViewByURLPattern = require("../index").getViewByURLPattern;

	it("gets a view from a URL", function(done) {
		var test = this;
		var view = {
			name: test.fake.random.word(),
			url: ["/page/:page"]
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
			url: ["/apple"]
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
			url: ["/apple"]
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
			url: ["/apple/"]
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

	it("gets a view by multiple url", function(done) {
		var test = this;
		var view = {
			name: test.fake.random.word(),
			url: ["/page/:page", "/"]
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
      var url = '/Apple';
	  var view = {
	    name: test.fake.random.word(),
	    url: [url]
	  };

	  setView(test.template.id, view, function(err) {
	    if (err) return done.fail(err);
	    getViewByURLPattern(test.template.id, 'apple', function(err, viewName) {
	      if (err) return done.fail(err);
	      expect(viewName).toEqual(view.name);
	      done();
	    });
	  });
	});

	it("gets a view by an uppercase URL", function(done) {
	  var test = this;
      var url = "/apple";
	  var view = {
	    name: test.fake.random.word(),
	    url: [url]
	  };

	  setView(test.template.id, view, function(err) {
	    if (err) return done.fail(err);
	    getViewByURLPattern(test.template.id, '/Apple', function(err, viewName) {
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