const puppeteer = require("puppeteer");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const dirname = require('path').dirname;

async function main(site, path, callback) {
	const width = 1260;
	const height = 1260;

	try {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();

		await page.setViewport({
			width: width,
			height: height,
			deviceScaleFactor: 2,
		});

		await page.goto(site);
		await page.screenshot({ path: path });
		await browser.close();
		await imagemin([path], dirname(path), {
			plugins: [imageminPngquant()],
		});
	} catch (e) {
		return callback(e);
	}

	callback();
}

module.exports = main;
