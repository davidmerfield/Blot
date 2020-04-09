const fs = require("fs-extra");

const fonts = fs
	.readdirSync(__dirname)
	.filter((i) => {
		return (
			fs.statSync(`${__dirname}/${i}`).isDirectory() &&
			fs.existsSync(`${__dirname}/${i}/package.json`) &&
			fs.existsSync(`${__dirname}/${i}/style.css`)
		);
	})
	.map((id) => {
		const package = fs.readJsonSync(`${__dirname}/${id}/package.json`);
		const styles = fs.readFileSync(`${__dirname}/${id}/style.css`, "utf8");

		const name = package.name;
		const stack = package.stack || name;
		const line_height = package.line_height;

		return {
			name,
			id,
			stack,
			line_height,
			styles,
		};
	});

module.exports = fonts;
