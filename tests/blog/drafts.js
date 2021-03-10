describe("drafts work", function () {
	const sync = require("sync");
	const blogServer = require("blog");
	const fs = require("fs-extra");
	const request = require("request");
	const Express = require("express");
	const config = require("../../config");
	const guid = require("helper").guid;

	global.test.blog();

	it("updates a draft dynamically", function (done) {
		const path = "/drafts/entry.txt";
		const firstContents = guid();
		const secondContents = guid();

		this.writeDraft(path, firstContents, (err) => {
			if (err) return done.fail(err);

			request(this.origin + "/draft/stream" + path, { strictSSL: false }).on(
				"data",
				(data) => {
					data = data.toString().trim();
					if (data) {
						expect(data).toContain(secondContents);
						done();
					}
				}
			);

			this.writeDraft(path, secondContents, (err) => {
				if (err) return done.fail(err);
			});
		});
	});

	// Create a webserver for testing remote files
	beforeEach(function (done) {
		let server;
		const test = this;
		server = Express();
		server.use(function (req, res, next) {
			const _get = req.get;
			req.get = function (arg) {
				if (arg === "host") {
					return `${test.blog.handle}.${config.host}`;
				} else return _get(arg);
			};
			next();
		});
		server.use(blogServer);
		test.origin = "http://localhost:" + 8919;
		test.server = server.listen(8919, done);

		this.writeDraft = (path, contents, callback) => {
			sync(this.blog.id, (err, folder, done) => {
				if (err) return callback(err);
				fs.outputFileSync(this.blogDirectory + path, contents, "utf-8");
				folder.update(path, function (err) {
					if (err) return callback(err);
					done(null, callback);
				});
			});
		};
	});

	afterEach(function (done) {
		this.server.close(done);
	});
});
