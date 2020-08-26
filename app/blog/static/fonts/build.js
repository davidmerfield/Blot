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
// we generate the @font-face styles
const WEIGHTS = {
	thin: 100,
	extralight: 200,
	light: 300,
	roman: 400,
	regular: 400,
	book: 400,
	text: 450 /* IBM PLEX has 'text' as 450 weight */,
	medium: 500,
	semibold: 500,
	bold: 600,
	heavy: 700,
	black: 900,
};

if (!process.argv[2]) {
	printCandidates();
	process.exit();
}

generatePackage(directory);

generateStyle(directory);

function generatePackage(directory) {
	const packagePath = directory + "/package.json";

	if (!fs.existsSync(packagePath))
		fs.outputJsonSync(packagePath, {}, { spaces: 2 });

	let package = fs.readJsonSync(packagePath);

	// Will map cooper-hewitt -> Cooper Hewitt
	if (!package.name)
		package.name = basename(directory)
			.split("-")
			.join(" ")
			.split(" ")
			.map((w) => w[0].toUpperCase() + w.slice(1))
			.join(" ");

	if (!package.stack) package.stack = `'${package.name}'`;

	if (!package.line_height) package.line_height = 1.4;

	fs.outputJsonSync(packagePath, package, { spaces: 2 });
}

function generateStyle(directory) {
	const stylePath = directory + "/style.css";
	const package = fs.readJsonSync(directory + "/package.json");

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

		let weight;

		let nameWithoutExtensionAndStyle = nameWithoutExtension
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
			extensions: [extname(file)],
		};
	});

	let result = "";
	let typeset = "";

	Object.keys(family)

		// We order the file names by weight such that the resulting CSS
		// Within weights, we show normal first (i.e. non-italic)
		.sort((a, b) => {
			if (family[a].weight > family[b].weight) return 1;
			if (family[a].weight < family[b].weight) return -1;

			if (family[a].style === "normal" && family[b].style !== "normal")
				return -1;
			if (family[a].style !== "normal" && family[b].style === "normal")
				return 1;

			return 0;
		})
		.forEach((file) => {
			let name = package.name;
			let style = family[file].style;
			let weight = family[file].weight;
			let extensions = family[file].extensions;
			const base = "/fonts/" + basename(directory);
			let src;

			let contentHashes = {};

			if (style === "normal" && weight === 400) {
				typeset = generateTypeset(
					`${__dirname}/${basename(directory)}/${file}${
						extensions.filter((ext) => ext !== ".eot")[0]
					}`
				);
			}

			extensions.forEach((extension) => {
				contentHashes[extension] = hash(
					fs.readFileSync(directory + "/" + file + extension)
				).slice(0, 6);
			});

			const extensionList = `${EXTENSIONS.filter(
				(EXTENSION) =>
					EXTENSION !== ".eot" && extensions.indexOf(EXTENSION) > -1
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

			const template = `

@font-face {
  font-family: '${name}';
  font-style: ${style};
  font-weight: ${weight};
  ${src}
}`;

			result += template;
		});

	result = [
		"/* Do not edit this directly, it was generated by a script. */",
		result,
		typeset,
	].join("\n");

	console.log();
	console.log(package.name);
	for (let w = 100; w <= 900; w += 100) {
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
			}`
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

function generateTypeset(path) {
	console.log("generating typeset", path);
	// open a font synchronously
	const font = fontkit.openSync(path);

	const double_quote_width =
		font.getGlyph(font.glyphsForString('"')[0].id).advanceWidth /
		font.unitsPerEm;

	const single_quote_width =
		font.getGlyph(font.glyphsForString("'")[0].id).advanceWidth /
		font.unitsPerEm;

	const typeset = `
.pull-double {margin-left:-${double_quote_width}em}
.push-double{margin-right:${double_quote_width}em}
.pull-single{margin-left:-${single_quote_width}em}
.push-single{margin-right:${single_quote_width}em}
.pull-double,.pull-single,.push-double,.push-single{display:inline-block}
`;

/*
.pull-T,.pull-V,.pull-W,.pull-Y{margin-left:-.07em}
.push-T,.push-V,.push-W,.push-Y{margin-right:.07em}
.pull-C,.pull-O,.pull-c,.pull-o{margin-left:-.04em}
.push-C,.push-O,.push-c,.push-o{margin-right:.04em}
.pull-A{margin-left:-.03em}
.push-A{margin-right:.03em}
*/

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

process.exit();
