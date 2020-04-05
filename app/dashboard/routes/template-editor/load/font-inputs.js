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


// Helvetica: 
//  stack: 'helvetica neue', helvetica, sans-serif

// Avenir:
// 	stack: 'avenir next', avenir, sans-serif

// System Sans:
// 	stack:
// 	-apple-system, BlinkMacSystemFont, 'avenir next', avenir, 'helvetica neue', helvetica, ubuntu, roboto, noto, 'segoe ui', arial, sans-serif

// Athelas:
// 	stack: athelas,georgia,serif

// Georgia:
// 	stack: georgia,serif

// Times: 
// 	stack: times,serif

// Bodoni:
// 	stack: 'Bodoni MT', serif

// Calisto:
// 	stack: 'Calisto MT', serif

// Garamond:
// 	stack: garamond, serif

// Baskerville:
// 	stack: baskerville,serif

// Code:
// 	stack: Consolas, monaco, monospace

// Courier:
// 	stack: 'Courier Next', courier, monospace