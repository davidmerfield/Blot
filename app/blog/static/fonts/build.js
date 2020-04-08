const fs = require("fs-extra");
const directory = __dirname + "/" + process.argv[2];
const basename = require("path").basename;
const extname = require("path").extname;
const extensions = [".svg", ".eot", ".ttf", ".woff", ".woff2", ".otf"];

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

	console.log("Wrote", packagePath);
	fs.outputJsonSync(packagePath, package, { spaces: 2 });
}

function generateStyle(directory) {
	const stylePath = directory + "/style.css";

	const fontFiles = fs
		.readdirSync(directory)
		.filter((i) => extensions.indexOf(extname(i)) > -1);

	console.log(fontFiles);

	const weightsAndStyles = fontFiles.reduce((acc, i) => {
		console.log(acc)
		acc = acc || [];
		const fileWithoutExtension = i.slice(0, i.indexOf("."));
		console.log(fileWithoutExtension)
		if (acc.indexOf(fileWithoutExtension) > -1) return;
		return acc.push(fileWithoutExtension);
	});

	console.log(weightsAndStyles);

	// 	const template = `

	// @font-face {
	//   font-family: '${name}';
	//   font-style: '${style}';
	//   font-weight: '${weight}';
	//   src: url('webfont.eot'); /* IE9 Compat Modes */
	//   src: url('webfont.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
	//        url('webfont.woff2') format('woff2'), /* Super Modern Browsers */
	//        url('webfont.woff') format('woff'), /* Pretty Modern Browsers */
	//        url('webfont.ttf')  format('truetype'), /* Safari, Android, iOS */
	//        url('webfont.svg#svgFontName') format('svg'); /* Legacy iOS */
	// }

	// 	`;

	// console.log(weights);
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
