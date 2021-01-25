module.exports = function (prefix) {
	return {
		add: require("./add")(prefix),
		process: require("./process")(prefix),
		reset: require("./reset")(prefix),
	};
};
