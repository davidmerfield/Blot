const fontkit = require("fontkit");

// open a font synchronously
const font = fontkit.openSync(process.argv[2]);

const double_quote_width =
	font.getGlyph(font.glyphsForString('"')[0].id).advanceWidth / font.unitsPerEm;

const single_quote_width =
	font.getGlyph(font.glyphsForString("'")[0].id).advanceWidth / font.unitsPerEm;

const typeset = `
.pull-double {margin-left:-${double_quote_width}em}
.push-double{margin-right:${double_quote_width}em}
.pull-single{margin-left:-${single_quote_width}em}
.push-single{margin-right:${single_quote_width}em}
.pull-double,.pull-single,.push-double,.push-single{display:inline-block}
.pull-T,.pull-V,.pull-W,.pull-Y{margin-left:-.07em}
.push-T,.push-V,.push-W,.push-Y{margin-right:.07em}
.pull-C,.pull-O,.pull-c,.pull-o{margin-left:-.04em}
.push-C,.push-O,.push-c,.push-o{margin-right:.04em}
.pull-A{margin-left:-.03em}
.push-A{margin-right:.03em}
`;

console.log(typeset);
