const fs = require("fs-extra");
const importQuestions = require("models/question/import");

// iefe to use await
(async () => {
    const data = await fs.readJson("questions.json");
    await importQuestions(data);

  console.log("All questions imported");
  process.exit();
})();
