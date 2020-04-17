const fs = require("fs-extra");
const markdown = require("../../index");

describe("citations", function() {
	global.test.blog();

	// todo 
	// add tests for invalid bibliography and csl files

	fs.readdirSync(__dirname)
		.filter((file) => file.slice(-4) === ".txt")
		.forEach((file) => {
			it("handles citations in posts with " + file.slice(0,-4).split('-').join(' '), function(done) {
				fs.copySync(__dirname, this.blogDirectory);

				const path = "/" + file;
				markdown.read(this.blog, path, {}, function(err, html) {
					if (err) return done.fail(err);

					let expected;

					try {
						expected = fs.readFileSync(__dirname + path + ".html", "utf8");
					} catch (e) {
						fs.outputFileSync(__dirname + path + ".html", html);
						expected = html;
					}

					expect(expected).toEqual(html);
					done();
				});
			});
		});
});
