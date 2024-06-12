const faker = require("faker");
const async = require("async");
const fs = require("fs-extra");
const { create } = require("models/question");

const walk = dir => {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = dir + "/" + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(walk(file));
    } else {
      /* Is a file */
      results.push(file);
    }
  });
  return results;
};

const urlFromFilename = function (path) {
  if (path.endsWith("index.html"))
    return require("path").basename(require("path").dirname(path));
  return path
    .slice(path.lastIndexOf("/") + 1, path.lastIndexOf("."))
    .toLowerCase();
};

const slugs = walk(require("helper/rootDir") + "/app/views")
  .filter(path => path.endsWith(".html"))
  .map(urlFromFilename)
  .filter((x, i, a) => a.indexOf(x) === i)
  .sort();

const randomSlug = () => slugs[Math.floor(Math.random() * slugs.length)];

const questionStarts = [
  "How do I",
  "How to",
  "How to",
  "How to",
  "How does",
  "How should",
  "How much",
  "How long",
  "How far can",
  "Which",
  "When",
  "What is",
  "What to do with",
  "What kind of",
  "What is the way to",
  "Where can I",
  "Should I",
  "Can I"
];
const randomQuestionStart = () =>
  questionStarts[Math.floor(Math.random() * questionStarts.length)];

const randomQuestionBody = () => {
  const wordCount = Math.ceil(Math.random() * 4);
  const body = faker.lorem.sentence(wordCount);
  return body.at(0).toLowerCase() + body.slice(1, -1);
};

const randomQuestion = () =>
  randomQuestionStart() + " " + randomQuestionBody() + "?";

const totalQuestions = 30;
const questions = [];

while (questions.length < totalQuestions) {
  const replies = [];
  const totalReplies = Math.ceil(Math.random() * 5);
  while (replies.length < totalReplies) {
    replies.push({
      author: faker.name.findName(),
      body: faker.lorem.paragraphs()
    });
  }
  questions.push({
    author: faker.name.findName(),
    title: randomQuestion(),
    tags: [randomSlug(), randomSlug(), randomSlug()],
    body: faker.lorem.paragraphs(),
    replies
  });
}

// iefe to use await
(async () => {
  for (const question of questions) {
    console.log("Adding", question.title);
    const { id } = await create({
      title: question.title,
      author: question.author,
      body: question.body,
      tags: question.tags
    });

    for (const reply of question.replies) {
      await create({
        body: reply.body,
        parent: id
      });
    }
  }

  console.log("All questions added");
  process.exit();
})();
