module.exports = function(req, res, next) {


	for (let key in req.locals) {
		if (key.indexOf("_font") === -1) continue;

		let fontName = req.locals[key];

		if (fonts[fontName]) {
			req.locals[key + '_files'] = fonts[fontName].files;
			req.locals[key] = fonts[fontName].stack;
		}
	}

	console.log(req.locals);
	console.log(req.partials);

	next();
};

const fonts = {
	Wremena: {
		stack: "Wremena, serif",
		files: `
		@font-face {
		  font-family: 'Wremena';
		  src: url('/fonts/wremena/regular.otf'); /* IE9 Compat Modes */
		  src: url('/fonts/wremena/regular.otf') format('embedded-opentype'), /* IE6-IE8 */
		       url('/fonts/wremena/regular.woff') format('woff');
		}

		@font-face {
		  font-family: 'Wremena';
		  font-weight: 300;
		  src: url('/fonts/wremena/light.otf'); /* IE9 Compat Modes */
		  src: url('/fonts/wremena/light.otf') format('embedded-opentype'), /* IE6-IE8 */
		       url('/fonts/wremena/light.woff') format('woff');
		}

		@font-face {
		  font-family: 'Wremena';
		  font-weight: bold;
		  src: url('/fonts/wremena/bold.otf'); /* IE9 Compat Modes */
		  src: url('/fonts/wremena/bold.otf') format('embedded-opentype'), /* IE6-IE8 */
		       url('/fonts/wremena/bold.woff') format('woff');
		}

		`,
	},
};

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
