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
		.filter((key) => ["page_size", "nav_location", "thumbnail_size", "spacing_size"].indexOf(key) > -1)
		.map((key) => {

			let range = req.template.locals[key +'_range'];
			let min = (range && range[0]) || (MAP[key] && MAP[key].min) || 1;
			let max = (range && range[1]) || (MAP[key] && MAP[key].max) || 60;

			return {
				key,
				value: req.template.locals[key],
				isRange: ["page_size", "thumbnail_size", "spacing_size"].indexOf(key) > -1,
				label: (MAP[key] && MAP[key].label) || desnake(key),
				max,
				min
			};
		});

	return next();
};

function desnake(str) {
	str = str.split("_").join(" ");
	str = str[0].toUpperCase() + str.slice(1);
	return str;
}
