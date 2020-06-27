var clfdate = require("helper").clfdate;

module.exports = function(err, req, res, next) {
	if (err.message === "NOUSER") {
		console.log(
			clfdate(),
			req.headers["x-request-id"],
			req.protocol + "://" + req.hostname + req.originalUrl,
			"[NOUSER]",
      "cookies=" + req.headers.cookie,
			JSON.stringify(req.session)
		);
		return next();
	}

	console.log(err);
	console.log(err.trace);
	console.log(err.stack);
	res.status(500);
	res.send(":( Error");
};
