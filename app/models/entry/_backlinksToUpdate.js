var getByUrl = require("./getByUrl");
var async = require("async");
var _ = require("lodash");
var debug = require("debug")("blot:entry:set:backlinksToUpdate");

function backlinksToUpdate(
	blogID,
	entry,
	previousInternalLinks,
	previousPermalink,
	callback
) {
	var removedInternalLinks = [];
	var existingInternalLinks = [];
	var newInternalLinks = [];

	// Since this post is no longer available, none of its current or former
	// links are present. Remove everything.
	if (entry.deleted) {
		removedInternalLinks = _.union(entry.internalLinks, previousInternalLinks);

		// Since this post exists, we need to work out which dependencies were
		// added since the last time this post was saved. We also need to work
		// out which dependencies were removed.
	} else {
		newInternalLinks = _.difference(entry.internalLinks, previousInternalLinks);
		existingInternalLinks = _.intersection(
			entry.internalLinks,
			previousInternalLinks
		);
		removedInternalLinks = _.difference(
			previousInternalLinks,
			entry.internalLinks
		);
	}

	debug("internalLinks", entry.internalLinks);
	debug("previousInternalLinks", previousInternalLinks);
	debug("removedInternalLinks", removedInternalLinks);
	debug("newInternalLinks", newInternalLinks);

	let changes = {};

	let linksToValidate = entry.internalLinks.concat(removedInternalLinks);

	async.filter(
		linksToValidate,
		function (urlPath, next) {
			debug("getting", blogID, urlPath);
			getByUrl(blogID, urlPath, function (backLinkedEntry) {
				if (!backLinkedEntry) {
					debug("no backlinked entry for", urlPath);
					return next(null, false);
				}

				debug("found backlinked entry", backLinkedEntry.path, "for", urlPath);
				changes[backLinkedEntry.url] = {
					path: backLinkedEntry.path,
					backlinks: backLinkedEntry.backlinks,
				};
				next(null, true);
			});
		},
		function (err, validInternalLinks) {
			removedInternalLinks = removedInternalLinks.filter(
				(link) => validInternalLinks.indexOf(link) > -1
			);

			newInternalLinks = newInternalLinks.filter(
				(link) => validInternalLinks.indexOf(link) > -1
			);

			existingInternalLinks = existingInternalLinks.filter(
				(link) => validInternalLinks.indexOf(link) > -1
			);

			// For each internal link which was removed from this
			//
			removedInternalLinks.forEach(
				(link) =>
					(changes[link].backlinks = changes[link].backlinks.filter(
						(link) =>
							link !== entry.permalink && link !== entry.previousPermalink
					))
			);

			newInternalLinks.forEach((link) =>
				changes[link].backlinks.push(entry.permalink)
			);

			if (previousPermalink !== entry.permalink)
				existingInternalLinks.forEach((link) => {
					changes[link].backlinks = changes[link].backlinks.filter(
						(link) => link !== previousPermalink
					);
					changes[link].backlinks.push(entry.permalink);
				});

			let result = {};

			for (var foo in changes)
				result[changes[foo].path] = _.uniq(changes[foo].backlinks);

			debug("result", result);
			callback(null, result);
		}
	);
}

module.exports = backlinksToUpdate;
