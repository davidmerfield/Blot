const FONTS = require("../../../../blog/static/fonts");

module.exports = function(req, res, next) {
	res.locals.partials.font = "template-editor/inputs/font";
	res.locals.fonts = Object.keys(req.template.locals)
		.filter((key) => key.indexOf("_font") > -1)
		.map((key) => {
			return {
				key,
				options: FONTS.map((option) => {
					return {
						selected:
							req.template.locals[key].id &&
							option.id === req.template.locals[key].id
								? "selected"
								: "",
						name: option.name,
						id: option.id,
					};
				}),
				value: req.template.locals[key],
				label: desnake(key),
			};
		});

	return next();
};

// function (req, res, next) {
// 	let fontChanges =

// 	if (changes.)

// 	return next()
// }

function desnake(str) {
	str = str.split("_").join(" ");
	str = str[0].toUpperCase() + str.slice(1);
	return str;
}
