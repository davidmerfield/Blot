module.exports = function (prefix) {
	return {
		add: require("./add")(prefix),
		inspect: require("./inspect")(prefix),
		process: require("./process")(prefix),
		reset: require("./reset")(prefix),
	};
};
