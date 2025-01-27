describe("exportQuestions", function () {
    require("./setup")();
  
    const client = require("models/client"); // Ensure this client is correctly initialized
    const exportQuestions = require('../export'); // Adjust the path as needed
    const create = require("../create"); // Function to create questions/replies
  
    it("exports questions correctly from Redis", async function (done) {
      // Insert mock data into Redis using create function
      const question1 = await create({ title: 'How?', body: 'Yes' });
      const question2 = await create({ title: 'What?', body: 'No' });
      const reply1 = await create({ body: 'Reply to How?', parent: question1.id });
  
      const exportedData = await exportQuestions();
  
      const expectedData = [
        {
          id: question1.id,
          title: 'How?',
          body: 'Yes',
          parent: '',
          author: '',
          tags: [],
          created_at: question1.created_at,
          replies: [
            {
              id: reply1.id,
              title: '',
              body: 'Reply to How?',
              parent: question1.id,
              author: '',
              tags: [],
              created_at: reply1.created_at,
              comments: []
            }
          ]
        },
        {
          id: question2.id,
          title: 'What?',
          body: 'No',
          parent: '',
          author: '',
          tags: [],
          created_at: question2.created_at,
          replies: []
        }
      ];
  
      expect(exportedData).toEqual(expectedData);
      done();
    });
  
    it("handles empty questions gracefully", async function (done) {
        client.keys("blot:questions:*", async function (err, keys) {
            if (err) return done(err);
            if (keys.length > 0) {
              client.del(keys, async function (err, response) {
                if (err) return done(err);
                const exportedData = await exportQuestions();
                expect(exportedData).toEqual([]);
                done();
            });
            } else {
                const exportedData = await exportQuestions();
                expect(exportedData).toEqual([]);
                done();
                    }
          });
    });
  
    it("handles questions without replies", async function (done) {
      const question = await create({ title: 'How?', body: 'Yes' });
  
      const exportedData = await exportQuestions();
  
      const expectedData = [
        {
          id: question.id,
          title: 'How?',
          body: 'Yes',
          parent: '',
          author: '',
          tags: [],
          created_at: question.created_at,
          replies: []
        }
      ];
  
      expect(exportedData).toEqual(expectedData);
      done();
    });
  
    it("handles replies without comments", async function (done) {
      const question = await create({ title: 'How?', body: 'Yes' });
      const reply = await create({ body: 'Reply to How?', parent: question.id });
  
      const exportedData = await exportQuestions();
  
      const expectedData = [
        {
          id: question.id,
          title: 'How?',
          body: 'Yes',
          parent: '',
          author: '',
          tags: [],
          created_at: question.created_at,
          replies: [
            {
              id: reply.id,
                title: '',
              body: 'Reply to How?',
              parent: question.id,
              author: '',
              tags: [],
              created_at: reply.created_at,
              comments: []
            }
          ]
        }
      ];
  
      expect(exportedData).toEqual(expectedData);
      done();
    });
  
    it("handles questions with tags", async function (done) {
        const question = await create({ title: 'How?', body: 'Yes', tags: ['tag1', 'tag2'] });
      
        const exportedData = await exportQuestions();
      
        const expectedData = [
          {
            id: question.id,
            title: 'How?',
            body: 'Yes',
            parent: '',
            author: '',
            tags: ["tag1","tag2"],
            created_at: question.created_at,
            replies: []
          }
        ];
      
        expect(exportedData).toEqual(expectedData);
        done();
      });

      it("handles questions with author information", async function (done) {
        const question = await create({ title: 'How?', body: 'Yes', author: 'User1' });
      
        const exportedData = await exportQuestions();
      
        const expectedData = [
          {
            id: question.id,
            title: 'How?',
            body: 'Yes',
            parent: '',
            author: 'User1',
            tags: [],
            created_at: question.created_at,
            replies: []
          }
        ];
      
        expect(exportedData).toEqual(expectedData);
        done();
      });

      it("handles replies with author information", async function (done) {
        const question = await create({ title: 'How?', body: 'Yes' });
        const reply = await create({ body: 'Reply to How?', parent: question.id, author: 'User2' });
      
        const exportedData = await exportQuestions();
      
        const expectedData = [
          {
            id: question.id,
            title: 'How?',
            body: 'Yes',
            parent: '',
            author: '',
            tags: [],
            created_at: question.created_at,
            replies: [
              {
                id: reply.id,
                title: '',
                body: 'Reply to How?',
                parent: question.id,
                author: 'User2',
                tags: [],
                created_at: reply.created_at,
                comments: []
              }
            ]
          }
        ];
      
        expect(exportedData).toEqual(expectedData);
        done();
      });
  });