"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-console
var program = require("commander");
var editorconfig = require("./");
// tslint:disable-next-line:no-var-requires
var pkg = require('./package.json');
function cli(args) {
    program.version('EditorConfig Node.js Core Version ' + pkg.version);
    program
        .usage([
        '[OPTIONS] FILEPATH1 [FILEPATH2 FILEPATH3 ...]',
        program._version,
        'FILEPATH can be a hyphen (-) if you want path(s) to be read from stdin.',
    ].join('\n\n  '))
        .option('-f <path>', 'Specify conf filename other than \'.editorconfig\'')
        .option('-b <version>', 'Specify version (used by devs to test compatibility)')
        .option('-v, --version', 'Display version information')
        .parse(args);
    // Throw away the native -V flag in lieu of the one we've manually specified
    // to adhere to testing requirements
    program.options.shift();
    var files = program.args;
    if (!files.length) {
        program.help();
    }
    files
        .map(function (filePath) { return editorconfig.parse(filePath, {
        config: program.F,
        version: program.B,
    }); })
        .forEach(function (parsing, i, _a) {
        var length = _a.length;
        parsing.then(function (parsed) {
            if (length > 1) {
                console.log("[" + files[i] + "]");
            }
            Object.keys(parsed).forEach(function (key) {
                console.log(key + "=" + parsed[key]);
            });
        });
    });
}
exports.default = cli;
