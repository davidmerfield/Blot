const MAP = {
	page_size: {
		label: "Number of posts per page",
		min: 1,
		max: 60,
	},
};

module.exports = function(req, res, next) {
	res.locals.partials.range = "template-editor/inputs/range";
	res.locals.layouts = Object.keys(req.template.locals)
		.filter((key) => ["page_size", "nav_location"].indexOf(key) > -1)
		.map((key) => {
			return {
				key,
				value: req.template.locals[key],
				isRange: key === "page_size",
				label: (MAP[key] && MAP[key].label) || desnake(key),
				max: (MAP[key] && MAP[key].max) || 60,
				min: (MAP[key] && MAP[key].min) || 1,
			};
		});

	return next();
};

function desnake(str) {
	str = str.split("_").join(" ");
	str = str[0].toUpperCase() + str.slice(1);
	return str;
}
