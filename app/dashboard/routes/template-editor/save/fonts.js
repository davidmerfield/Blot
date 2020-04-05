module.exports = function(req, res, next) {
	for (let key in req.locals) {
		if (key.indexOf("_font") === -1) continue;
	}

	next();
};
