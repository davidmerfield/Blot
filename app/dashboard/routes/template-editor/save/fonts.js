const FONTS = require("../../../../blog/static/fonts");

module.exports = function(req, res, next) {
	console.log(req.locals);

	for (let key in req.locals) {
		if (key.indexOf("_font") === -1) continue;

		let fontName = req.locals[key];
		let match = FONTS.slice().filter(({ id }) => fontName === id)[0];

		if (match) {
			req.locals[key] = match;
		} 
	}

	console.log(req.locals);

	next();
};
