const get = require("../get/blog");
const Entry = require("entry");
const Entries = require("entries");
const colors = require("colors");
const yesno = require("yesno");
const async = require("async");

get(process.argv[2], function(err, user, blog) {
	if (err) throw err;

	loadEntries(blog.id, function(err, { deleted, published }) {
		if (err) throw err;

		async.eachSeries(
			deleted,
			(deletedEntry, next) => {
				console.log(
					"\nLooking up candidates for deleted entry".dim,
					deletedEntry.id
				);
				const candidates = published.filter(
					publishedEntry =>
						publishedEntry.title === deletedEntry.title &&
						publishedEntry.dateStamp !== deletedEntry.dateStamp &&
						publishedEntry.created === publishedEntry.dateStamp
				);

				if (!candidates.length) {
					return console.log("No candidates found for".dim, deletedEntry.id);
				}

				console.log(
					`Found ${candidates.length} candidates for`.dim,
					deletedEntry.id
				);

				async.eachSeries(
					candidates,
					(candidate, nextCandidate) => {
						const message = `
${candidate.id}
 ${"  title:".dim} ${
							candidate.title[
								candidate.title === deletedEntry.title ? "green" : "red"
							]
						}
 ${"summary:".dim} ${
							(candidate.summary.slice(0, 20) + "...")[
								candidate.summary === deletedEntry.summary ? "green" : "red"
							]
						}

 use this? (y/n)`;

						yesno.ask(message, false, function(ok) {
							if (!ok) {
								console.log(" skipped".dim);
								return nextCandidate();
							}

							Entry.set(
								blog.id,
								candidate.id,
								{
									created: deletedEntry.created,
									dateStamp: deletedEntry.dateStamp
								},
								next
							);
						});
					},
					next
				);
			},
			function(err) {
				if (err) throw err;
				console.log("Checked all deleted entries!");
				process.exit();
			}
		);
	});
});

function loadEntries(blogID, callback) {
	Entries.get(blogID, { list: "deleted" }, function(err, { deleted }) {
		if (err) return callback(err);

		Entries.getAll(blogID, function(published) {
			if (err) return callback(err);

			callback(null, { published, deleted });
		});
	});
}
