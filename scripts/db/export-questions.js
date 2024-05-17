
const fs = require("fs-extra");
const exportQuestions = require("models/question/export");

// iefe to use await
(async () => {
  const data = await exportQuestions();

    await fs.writeJson("questions.json", data, { spaces: 2 });

  console.log("All questions exported ");
  process.exit();
})();
