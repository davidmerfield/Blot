var output = process.argv[2];
var fs = require("fs-extra");
var join = require("path").join;

module.exports = function() {
  output = join(__dirname, output);

  fs.ensureDirSync(output);
  fs.emptyDirSync(output);
  folder();
  console.log("Done!");
  process.exit();
};

function randomWord() {
  var len = 2 + Math.floor(Math.random() * 12);
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, len);
}

function randomSentence() {
  var len = 3 + Math.floor(Math.random() * 12);
  var words = [];
  while (words.length < len) words.push(randomWord());
  // capitalize first word in sentence
  words[0] = words[0][0].toUpperCase() + words[0].slice(1);
  return words.join(" ") + ".";
}

function randomParagraph() {
  var len = 10 + Math.floor(Math.random() * 12);
  var sentences = [];
  while (sentences.length < len) sentences.push(randomSentence());
  return sentences.join(" ");
}

function randomDocument() {
  var len = 50 + Math.floor(Math.random() * 50);
  var paragraphs = [];
  while (paragraphs.length < len) paragraphs.push(randomParagraph());
  return paragraphs.join("\n\n");
}

function randomPath() {
  var len = 1 + Math.floor(Math.random() * 4);
  var folderNames = [];
  while (folderNames.length < len) folderNames.push(randomWord());
  return folderNames.join("/");
}

function randomFolder() {
  var path = randomPath();
  var documents = [];
  var len = 1 + Math.floor(Math.random() * 20);
  while (documents.length < len) documents.push(randomDocument());
  documents.forEach(function(document) {
    fs.outputFileSync(join(output, path, randomWord() + ".txt"), document);
  });
}

function folder() {
  var len = 50 + Math.floor(Math.random() * 50);
  while (len) {
    len--;
    randomFolder();
  }
}
