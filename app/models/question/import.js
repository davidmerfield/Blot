const client = require("models/client");
const keys = require("./keys");

function incrAsync(key) {
  return new Promise((resolve, reject) => {
    client.incr(key, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function hmsetAsync(key, obj) {
  return new Promise((resolve, reject) => {
    client.hmset(key, obj, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function zaddAsync(key, score, member) {
  return new Promise((resolve, reject) => {
    client.zadd(key, score, member, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function saddAsync(key, member) {
  return new Promise((resolve, reject) => {
    client.sadd(key, member, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function importQuestions(allQuestions) {

    // validate input
    if (!Array.isArray(allQuestions)) {
        throw new Error('Input must be an array');
    }

    // check if there are any questions to import
    if (allQuestions.length === 0) {
        console.log('No questions to import');
        return;
    }

    for (const question of allQuestions) {
      const questionId = await incrAsync(keys.next_id);
      await hmsetAsync(keys.item(questionId), {
        id: questionId,
        title: question.title,
        body: question.body,
        parent: question.parent || '',
        author: question.author || '',
        tags: JSON.stringify(question.tags || []),
        created_at: question.created_at
      });

      for (const reply of question.replies) {
        const replyId = await incrAsync(keys.next_id);
        await hmsetAsync(keys.item(replyId), {
          id: replyId,
          title: reply.title || '',
          body: reply.body,
          parent: questionId,
          author: reply.author || '',
          tags: JSON.stringify(reply.tags || []),
          created_at: reply.created_at
        });
        await zaddAsync(keys.children(questionId), Date.now(), replyId);

        for (const comment of reply.comments) {
          const commentId = await incrAsync(keys.next_id);
          await hmsetAsync(keys.item(commentId), {
            id: commentId,
            title: comment.title || '',
            body: comment.body,
            parent: replyId,
            author: comment.author || '',
            tags: JSON.stringify(comment.tags || []),
            created_at: comment.created_at
          });
          await zaddAsync(keys.children(replyId), Date.now(), commentId);
        }
      }

      await saddAsync(keys.all_questions, questionId);
      await zaddAsync(keys.by_created, Date.now(), questionId);
    }

    console.log('Questions imported successfully');
  
}


module.exports = importQuestions;