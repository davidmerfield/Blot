describe("template", function() {
	require("./setup")({ createTemplate: true });

	var setView = require("../index").setView;
	var getViewByRoute = require("../index").getViewByRoute;

	it("gets a view from a URL", function(done) {
		var test = this;
		var view = {
			name: test.fake.random.word(),
			routes: ["/page/:page"]
		};

		setView(test.template.id, view, function(err) {
			if (err) return done.fail(err);
			getViewByRoute(test.template.id, "/page/1", function(
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
			routes: ["/apple"]
		};

		setView(test.template.id, view, function(err) {
			if (err) return done.fail(err);
			getViewByRoute(test.template.id, "/apple?foo=bar", function(
				err,
				viewName
			) {
				if (err) return done.fail(err);
				expect(viewName).toEqual(view.name);
				done();
			});
		});
	});

	it("gets a view from a URL with a trailing slash", function(done) {
		var test = this;
		var view = {
			name: test.fake.random.word(),
			routes: ["/apple"]
		};

		setView(test.template.id, view, function(err) {
			if (err) return done.fail(err);
			getViewByRoute(test.template.id, "/apple/", function(err, viewName) {
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
			routes: ["/apple/"]
		};

		setView(test.template.id, view, function(err) {
			if (err) return done.fail(err);
			getViewByRoute(test.template.id, "/apple", function(err, viewName) {
				if (err) return done.fail(err);
				expect(viewName).toEqual(view.name);
				done();
			});
		});
	});

	it("gets a view by multiple routes", function(done) {
		var test = this;
		var view = {
			name: test.fake.random.word(),
			routes: ["/page/:page", "/"]
		};

		setView(test.template.id, view, function(err) {
			if (err) return done.fail(err);
			getViewByRoute(test.template.id, "/", function(err, viewName) {
				if (err) return done.fail(err);
				expect(viewName).toEqual(view.name);

				getViewByRoute(test.template.id, "/page/2", function(err, viewName) {
					if (err) return done.fail(err);
					expect(viewName).toEqual(view.name);
					done();
				});
			});
		});
	});

	// // This fails because of a bug in the order of the processing
	// // of view.url in setView. It determines the redis key before
	// // normalizing the Url property of the view for storage...
	// xit("gets a view by a lowercase URL without slash", function(done) {
	//   var test = this;
	//   var view = {
	//     name: test.fake.random.word(),
	//     url: test.fake.random.word().toLowerCase()
	//   };

	//   setView(test.template.id, view, function(err) {
	//     if (err) return done.fail(err);
	//     getViewByURL(test.template.id, view.url, function(err, viewName) {
	//       if (err) return done.fail(err);
	//       expect(viewName).toEqual(view.name);
	//       done();
	//     });
	//   });
	// });

	// // This fails because of a bug in the order of the processing
	// // of view.url in setView. It determines the redis key before
	// // normalizing the Url property of the view for storage...
	// xit("gets a view by an uppercase URL", function(done) {
	//   var test = this;
	//   var view = {
	//     name: test.fake.random.word(),
	//     url: "/" + test.fake.random.word().toUpperCase()
	//   };

	//   setView(test.template.id, view, function(err) {
	//     if (err) return done.fail(err);
	//     getViewByURL(test.template.id, view.url, function(err, viewName) {
	//       if (err) return done.fail(err);
	//       expect(viewName).toEqual(view.name);
	//       done();
	//     });
	//   });
	// });

	// // This just returns an empty view
	// xit("returns an error for a non-existent URL", function(done) {
	//   var test = this;
	//   getViewByURL(test.template.id, "", function(err, viewName) {
	//     expect(err instanceof Error).toBe(true);
	//     expect(viewName).toBe(null);
	//     done();
	//   });
	// });
});
