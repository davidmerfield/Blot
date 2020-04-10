const LABEL_MAP = {
	page_size: "Number of posts per page",
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
				label: LABEL_MAP[key] || desnake(key),
				max: 100,
				min: 0,
			};
		});

	return next();
};

function desnake(str) {
	str = str.split("_").join(" ");
	str = str[0].toUpperCase() + str.slice(1);
	return str;
}
