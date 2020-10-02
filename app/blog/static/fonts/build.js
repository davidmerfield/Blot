const fs = require("fs-extra");
const directory = __dirname + "/" + process.argv[2];
const basename = require("path").basename;
const extname = require("path").extname;
const colors = require("colors");
const relative = require("path").relative;
const hash = require("helper").hash;
const fontkit = require("fontkit");

// Used to filter source font files and ordered
// in the preferred way for the final rule.
const EXTENSIONS = [".eot", ".woff2", ".woff", ".ttf", ".otf"];

// Used to avoid attempting to build
// fonts which don't require any files
const SYSTEM_FONTS = [
	"verdana",
	"arial",
	"times",
	"helvetica",
	"system-sans",
	"system-mono",
	"system-serif",
];

// Used to map source web font file names
// to their corresponding format in the
// @font-face rules generated, e.g.
// url('black-italic.ttf') format('truetype')
const FORMATS = {
	".ttf": "truetype",
	".otf": "opentype",
	".woff": "woff",
	".woff2": "woff2",
};

// Used to map source web font file names
// to their corresponding css weights, e.g.
// bold-italic.eot -> font-weight: 600 when
// we generate the @font-face styles. n.b.
// IBM PLEX has 'text' as 450 weight.
const WEIGHTS = {
	thin: 100,
	extralight: 200,
	light: 300,
	roman: 400,
	regular: 400,
	book: 400,
	text: 450,
	medium: 500,
	semibold: 500,
	bold: 600,
	heavy: 700,
	black: 900,
};

// Creates a placeholder package.json for
// the given webfont directory if none exists
function generatePackage(directory) {
	let package = {};

	try {
		package = fs.readJsonSync(directory + "/package.json");
	} catch (e) {
		// package might not yet exist
	}

	// Will map cooper-hewitt -> Cooper Hewitt
	package.name =
		package.name ||
		basename(directory)
			.split("-")
			.join(" ")
			.split(" ")
			.map((w) => w[0].toUpperCase() + w.slice(1))
			.join(" ");

	package.stack = package.stack || `'${package.name}'`;
	package.line_height = package.line_height || 1.4;
	package.line_width = package.line_width || 38;
	package.font_size = package.font_size || 1;

	fs.outputJsonSync(directory + "/package.json", package, { spaces: 2 });
}

// This generates the style.css file that will
// load all the web font files for each weight
// and style. Typeset.css rules are also generated
// based on the metrics of the webfont files.
function generateStyle(directory) {
	const stylePath = directory + "/style.css";
	const package = fs.readJsonSync(directory + "/package.json");
	const family = parseFamily(directory);
	const name = package.name;

	let result = Object.keys(family)

		// We order the file names by weight such that the resulting CSS
		// Within weights, we show normal first (i.e. non-italic)
		.sort(byWeight(family))

		// For each file name we generate the fontface rule
		.map((file) => {
			let fontVariant = family[file].fontVariant;
			let style = family[file].style;
			let weight = family[file].weight;
			let extensions = family[file].extensions;

			const src = generateSRC(extensions, directory, file);

			return generateFontFace(name, style, weight, fontVariant, src);
		})
		.join("\n");

	let RegularFontName = Object.keys(family).filter((name) => {
		return family[name].weight === 400 && family[name].style === "normal";
	})[0];

	let pathToRegularFont =
		directory +
		"/" +
		RegularFontName +
		family[RegularFontName].extensions.filter((ext) => ext !== ".eot")[0];

	let typeset = generateTypeset(pathToRegularFont, name);

	result += typeset;

	console.log();
	console.log(package.name);

	for (let w = 100; w <= 900; w += 100) {
		let hasSmallCaps =
			Object.keys(family).filter((name) => {
				return (
					family[name].weight === w && family[name].fontVariant === "small-caps"
				);
			}).length > 0;
		let hasWRegular =
			Object.keys(family).filter((name) => {
				return family[name].weight === w && family[name].style === "normal";
			}).length > 0;
		let hasWItalic =
			Object.keys(family).filter((name) => {
				return family[name].weight === w && family[name].style === "italic";
			}).length > 0;
		console.log(
			`${
				hasWRegular || hasWItalic
					? colors.green(w.toString())
					: colors.dim(w.toString())
			} ${hasWRegular ? colors.green("regular") : colors.dim("regular")} ${
				hasWItalic ? colors.green("italic") : colors.dim("italic")
			} ${hasSmallCaps ? colors.green("small-caps") : colors.dim("small-caps")}`
		);
	}
	console.log();
	console.log(colors.dim("folder: ", relative(process.cwd(), directory)));
	console.log(
		colors.dim("package:", relative(process.cwd(), directory + "/package.json"))
	);
	console.log(
		colors.dim("styles: ", relative(process.cwd(), directory + "/style.css"))
	);
	fs.outputFileSync(stylePath, result);
}

function generateTypeset(path, name, hasSmallCaps) {
	const font = fontkit.openSync(path);

	const double_quote_width =
		font.getGlyph(font.glyphsForString('"')[0].id).advanceWidth /
		font.unitsPerEm;

	const single_quote_width =
		font.getGlyph(font.glyphsForString("'")[0].id).advanceWidth /
		font.unitsPerEm;

	let typeset = `
.pull-double {margin-left:-${double_quote_width}em}
.push-double{margin-right:${double_quote_width}em}
.pull-single{margin-left:-${single_quote_width}em}
.push-single{margin-right:${single_quote_width}em}
.pull-double,.pull-single,.push-double,.push-single{display:inline-block}`;

	if (hasSmallCaps) {
		typeset += `.small-caps {font-family: ${name}small-caps;text-transform:lowercase}`;
	}

	return typeset;
}

function printCandidates() {
	let directories = fs
		.readdirSync(__dirname)

		// Ignore dot folders and folders whose name
		// starts with a dash
		.filter((i) => i[0] && i[0] !== "." && i[0] !== "-")
		.filter((i) => fs.statSync(`${__dirname}/${i}`).isDirectory())
		.filter((i) => {
			return (
				!fs.existsSync(`${__dirname}/${i}/package.json`) ||
				(!fs.existsSync(`${__dirname}/${i}/style.css`) &&
					SYSTEM_FONTS.indexOf(i) === -1)
			);
		});

	directories.forEach((directory) =>
		console.log(colors.green(`node app/blog/static/fonts/build ${directory}`))
	);

	fs.readdirSync(__dirname)
		.filter((i) => i[0] && i[0] !== "." && i[0] !== "-")
		.filter((i) => fs.statSync(`${__dirname}/${i}`).isDirectory())
		.filter((i) => directories.indexOf(i) === -1)
		.forEach((directory) =>
			console.log(
				colors.dim(
					`node app/blog/static/fonts/build ${directory}` +
						(SYSTEM_FONTS.indexOf(directory) === -1 ? "" : " (system)")
				)
			)
		);
}

function parseFamily(directory) {
	const fontFiles = fs
		.readdirSync(directory)
		.filter((i) => EXTENSIONS.indexOf(extname(i)) > -1);

	let family = {};

	fontFiles.forEach((file) => {
		let extension = extname(file);
		let nameWithoutExtension = file.slice(0, -extension.length);

		if (family[nameWithoutExtension]) {
			family[nameWithoutExtension].extensions.push(extname(file));
			return;
		}

		let style =
			nameWithoutExtension.indexOf("italic") > -1 ||
			nameWithoutExtension.indexOf("oblique") > -1
				? "italic"
				: "normal";

		let fontVariant =
			nameWithoutExtension.indexOf("small-caps") > -1 ? "small-caps" : "normal";

		let weight;

		let nameWithoutExtensionAndStyle = nameWithoutExtension
			.split("small-caps")
			.join("")
			.split("italic")
			.join("")
			.split("oblique")
			.join("")
			.split("-")
			.join("")
			.trim();

		if (
			(nameWithoutExtension === "italic" ||
				nameWithoutExtension === "oblique") &&
			!nameWithoutExtensionAndStyle
		) {
			nameWithoutExtensionAndStyle = "regular";
		}
		if (
			parseInt(nameWithoutExtensionAndStyle).toString() ===
			nameWithoutExtensionAndStyle
		) {
			weight = parseInt(nameWithoutExtensionAndStyle);
		} else if (WEIGHTS[nameWithoutExtensionAndStyle]) {
			weight = WEIGHTS[nameWithoutExtensionAndStyle];
		} else {
			console.error("");
			console.error(
				colors.red("Unable to parse weight:", nameWithoutExtensionAndStyle)
			);
			console.error(relative(process.cwd(), directory + "/" + file));
		}

		family[nameWithoutExtension] = {
			style,
			weight,
			fontVariant,
			extensions: [extname(file)],
		};
	});

	return family;
}

function generateSRC(extensions, directory, file) {
	const base = "/fonts/" + basename(directory);
	let contentHashes = {};
	let src;

	extensions.forEach((extension) => {
		contentHashes[extension] = hash(
			fs.readFileSync(directory + "/" + file + extension)
		).slice(0, 6);
	});

	const extensionList = `${EXTENSIONS.filter(
		(EXTENSION) => EXTENSION !== ".eot" && extensions.indexOf(EXTENSION) > -1
	)
		.map(
			(extension) =>
				`url('{{{config.cdn.origin}}}${base}/${file}${extension}?version=${contentHashes[extension]}&extension=${extension}') format('${FORMATS[extension]}')`
		)
		.join(",\n       ")}`;

	if (extensions.indexOf(".eot") > -1) {
		src = `src: url('{{{config.cdn.origin}}}${base}/${file}.eot?version=${contentHashes[".eot"]}&extension=.eot'); 
  src: url('{{{config.cdn.origin}}}${base}/${file}.eot?version=${contentHashes[".eot"]}&extension=.eot#iefix') format('embedded-opentype'), 
       ${extensionList};`;
	} else {
		src = `src: ${extensionList};`;
	}

	return src;
}

function generateFontFace(name, style, weight, fontVariant, src) {
	return `@font-face {
  font-family: '${fontVariant !== "normal" ? name + fontVariant : name}';
  font-style: ${style};
  font-weight: ${weight};
  ${src}
}`;
}

function byWeight(family) {
	return function (a, b) {
		if (family[a].weight > family[b].weight) return 1;
		if (family[a].weight < family[b].weight) return -1;

		if (family[a].style === "normal" && family[b].style !== "normal") return -1;
		if (family[a].style !== "normal" && family[b].style === "normal") return 1;

		return 0;
	};
}

if (!process.argv[2]) {
	printCandidates();
	process.exit();
}

generatePackage(directory);
generateStyle(directory);
process.exit();
