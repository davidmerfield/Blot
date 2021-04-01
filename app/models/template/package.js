var setMetadata = require("./setMetadata");
var type = require("helper/type");

module.exports = {
	generate: function(blogID, metadata, views) {
		var Package = {};

		if (metadata.name) {
			Package.name = metadata.name;
		}

		if (metadata.locals) {
			Package.locals = metadata.locals;
		}

		for (var name in views) {
			var view = views[name];
			var metadataToAddToPackage = {};

			if (view.url && view.url !== "/" + name) {
				metadataToAddToPackage.url = view.url;
			}

			if (view.locals && objectWithProperties(view.locals)) {
				metadataToAddToPackage.locals = view.locals;
			}

			if (view.partials && objectWithProperties(view.partials)) {
				// Don't output 'title': null in every view's partial
				for (let partial in view.partials)
					if (view.partials[partial] === null) delete view.partials[partial];

				if (Object.keys(view.partials).length)
					metadataToAddToPackage.partials = view.partials;
			}

			if (!objectWithProperties(metadataToAddToPackage)) continue;

			Package.views = Package.views || {};
			Package.views[name] = metadataToAddToPackage;
		}

		Package = JSON.stringify(Package, null, 2);

		return Package;
	},
	save: function(id, metadata, callback) {
		let views = {};
		let changes = {};

		if (!metadata) return callback(null, views);

		if (metadata.name) {
			changes.name = metadata.name;
		}

		if (metadata.locals && type(metadata.locals, "object")) {
			changes.locals = metadata.locals;
		}

		if (metadata.views && type(metadata.views, "object")) {
			views = metadata.views;
		}

		setMetadata(id, changes, function(err) {
			callback(err, views);
		});
	},
};

function objectWithProperties(obj) {
	return type(obj, "object") && Object.keys(obj).length;
}
