describe("date integration tests", function() {
	const sync = require("../../app/sync");
	const blogServer = require("../../app/blog");
	const fs = require("fs-extra");
	const Blog = require("../../app/models/blog");
	const Template = require("../../app/models/template");
	const request = require("request");

	global.test.blog();
	const blogHandle = "foo";

	global.test.server(createTestServer);

	it("date to match when in feed", function(done) {
		const test = this;
		const dateInput = "10/09/2018";
		const dateOutput = "October 9, 2018";

		createEntryWithDate(test, dateInput, function(err) {
			if (err) return done.fail(err);
			checkDateOnBlog(test, function(err, date) {
				if (err) return done.fail(err);
				expect(date).toEqual(dateOutput);
				done();
			});
		});
	});

	beforeEach(function(done) {
		const test = this;
		const templateName = "example";

		const view = {
			name: "entries.html",
			url: "",
			content: "{{#allEntries}}{{date}}{{/allEntries}}"
		};

		Template.create(test.blog.id, templateName, {}, function(err) {
			if (err) return done(err);
			Template.getTemplateList(test.blog.id, function(err, templates) {
				let templateId = templates.filter(
					({ name }) => name === templateName
				)[0].id;

				Template.setView(templateId, view, function(err) {
					if (err) return done(err);
					Blog.set(
						test.blog.id,
						{ handle: blogHandle, forceSSL: false, template: templateId },
						function(err) {
							if (err) return done(err);
							done();
						}
					);
				});
			});
		});
	});

	function createEntryWithDate(test, date, callback) {
		const path = "/test.txt";
		const contents = `Date: ${date}\n\n# Hello, world\n\nThis is a post.`;
		sync(test.blog.id, function(err, folder, done) {
			if (err) return callback(err);
			fs.outputFileSync(test.blogDirectory + path, contents, "utf-8");
			folder.update(path, function(err) {
				if (err) return callback(err);
				done(null, callback);
			});
		});
	}

	function checkDateOnBlog(test, callback) {
		request(test.origin, function(err, res, body) {
			expect(res.statusCode).toEqual(200);
			callback(null, body.trim());
		});
	}

	function createTestServer(server) {
		const host = blogHandle + ".blot.development";

		server.use(function(req, res, next) {
			const _get = req.get;
			req.get = function(arg) {
				if (arg === "host") {
					return host;
				} else return _get(arg);
			};
			next();
		});

		server.use(blogServer);
	}
});
