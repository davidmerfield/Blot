module.exports = function(req, res, next) {
	res.locals.partials.range = 'template-editor/inputs/range';
	res.locals.ranges = Object.keys(req.template.locals)
		.filter(key => key.indexOf("_size") > -1)
		.map(key => {
			return { key, value: req.template.locals[key], label: desnake(key), max: 100, min: 0 };
		});

	return next();
};

function desnake(str) {
	str = str.split("_").join(" ");
	str = str[0].toUpperCase() + str.slice(1);
	return str;
}
