module.exports = function(req, res, next) {
	res.locals.partials.font = 'template-editor/inputs/font';
	res.locals.fonts = Object.keys(req.template.locals)
		.filter(key => key.indexOf("_font") > -1)
		.map(key => {
			return { key, value: req.template.locals[key], label: desnake(key) };
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
