
const fs = require("fs-extra");
const exportQuestions = require("models/question/export");

// iefe to use await
(async () => {
  const data = await exportQuestions();

    await fs.writeJson("./data/questions.json", data, { spaces: 2 });

  console.log("All questions exported. To download: ");
  console.log("scp blot:/var/www/blot/data/questions.json .");
  console.log("To import, run:");
  console.log("node scripts/db/import-questions.js questions.json");
  
  process.exit();
})();
