const fs = require("fs-extra");
const directory = __dirname + "/" + process.argv[2];
const basename = require("path").basename;
const extname = require("path").extname;
const EXTENSIONS = [".eot", ".woff2", ".woff", ".ttf", ".otf"];
const FORMATS = {
	".ttf": "truetype",
	".otf": "opentype",
	".woff": "woff",
	".woff2": "woff2",
};

if (!process.argv[2]) return printCandidates();

console.log("Directory:", directory);

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

	console.log("Wrote:", packagePath);
	fs.outputJsonSync(packagePath, package, { spaces: 2 });
}

function generateStyle(directory) {
	const stylePath = directory + "/style.css";
	const package = fs.readJsonSync(directory + "/package.json");

	const fontFiles = fs
		.readdirSync(directory)
		.filter((i) => EXTENSIONS.indexOf(extname(i)) > -1);

	let family = {};

	const weightsAndStyles = fontFiles.forEach((file) => {
		let extension = extname(file);
		let nameWithoutExtension = file.slice(0, -extension.length);

		console.log("file", file);
		console.log("nameWithoutExtension", nameWithoutExtension);
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

		switch (nameWithoutExtensionAndStyle) {
			case "thin":
				weight = 200;
				break;
			case "extralight":
				weight = 200;
				break;
			case "light":
				weight = 300;
				break;
			case "roman":
				weight = 400;
				break;
			case "regular":
				weight = 400;
				break;
			case "book":
				weight = 400;
				break;
			case "text":
				weight = 400;
				break;
			case "medium":
				weight = 500;
				break;
			case "semibold":
				weight = 600;
				break;
			case "bold":
				weight = 600;
				break;
			case "heavy":
				weight = 700;
				break;
			case "black":
				weight = 900;
				break;
			default:
				console.error(
					"Unknown weight:",
					nameWithoutExtensionAndStyle,
					nameWithoutExtension
				);
				break;
		}

		family[nameWithoutExtension] = {
			style,
			weight,
			extensions: [extname(file)],
		};
	});

	let result = "";

	for (let file in family) {
		let name = package.name;
		let style = family[file].style;
		let weight = family[file].weight;
		let extensions = family[file].extensions;
		const base = "/fonts/" + basename(directory);
		let src;
		const extensionList = `${EXTENSIONS.filter(
			(EXTENSION) => EXTENSION !== ".eot" && extensions.indexOf(EXTENSION) > -1
		)
			.map(
				(extension) =>
					`url('${base}/${file}${extension}') format('${FORMATS[extension]}')`
			)
			.join(",\n       ")}`;

		if (extensions.indexOf(".eot") > -1) {
			src = `src: url('${base}/${file}.eot'); 
  src: url('${base}/${file}.eot?#iefix') format('embedded-opentype'), 
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
}
		`;

		result += template;
	}

	console.log("Wrote:", stylePath);
	fs.outputFileSync(stylePath, result);
}

function printCandidates() {
	let directories = fs
		.readdirSync(__dirname)
		.filter((i) => fs.statSync(`${__dirname}/${i}`).isDirectory())
		.filter((i) => {
			return (
				!fs.existsSync(`${__dirname}/${i}/package.json`) ||
				!fs.existsSync(`${__dirname}/${i}/style.css`)
			);
		});

	directories.forEach((directory) =>
		console.log(`node app/blog/static/fonts/build ${directory}`)
	);
}
