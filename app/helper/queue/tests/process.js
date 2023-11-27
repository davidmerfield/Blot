describe("Queue", function () {
  require("./setup")();

  var async = require("async");

  // process multiple queues at once

  it("exposes a process method", function (done) {
    this.queue.process(() => {});
    done();
  });

  it("processes a task", function (done) {
    var task = { path: "foo" };

    this.queue.process(function (blogID, savedTask, callback) {
      expect(blogID).toBe("blogID");
      expect(savedTask).toEqual(task);
      callback();
      done();
    });

    this.queue.add("blogID", task);
  });

  it("lets you hammer the queue with new tasks", function (done) {
    var blogID = "blogID";
    var id = 0;
    var tasks_added = [];
    var tasks_completed = [];
    var done_adding = false;

    this.queue.process(function (blogID, task, callback) {
      tasks_completed.push(task.id);
      callback();

      if (done_adding && tasks_completed.length == tasks_added.length) {
        expect(tasks_completed.sort()).toEqual(tasks_added.sort());
        done();
      }
    });

    const addTask = () => {
      let new_task_id = id++;
      tasks_added.push(new_task_id);
      this.queue.add(blogID, { id: new_task_id });
    };

    const adder = setInterval(addTask, 15);

    // Stop adding tasks after 3s
    setTimeout(() => {
      done_adding = true;
      clearInterval(adder);
      addTask();
    }, 1000 * 2);
  });

  it("processes the same task twice", function (done) {
    let task = { path: "foo" };
    let tasks = [task, task];
    let called = 0;

    this.queue.add("blogID", tasks);

    this.queue.process(function (blogID, _task, callback) {
      called++;
      callback();
      expect(task).toEqual(_task);
      if (called === tasks.length) done();
    });
  });

  it("gets multiple tasks in order", function (done) {
    var tasks = [{ path: "foo" }, { path: "bar" }];
    var isFirstRun = true;

    this.queue.process(function (blogID, savedTask, callback) {
      expect(blogID).toBe("blogID");

      if (isFirstRun) {
        expect(savedTask).toEqual(tasks[0]);
        isFirstRun = false;
        callback();
      } else {
        expect(savedTask).toEqual(tasks[1]);
        callback();
        done();
      }
    });

    this.queue.add("blogID", tasks);
  });

  it("gets multiple tasks in fair order", function (done) {
    var firstTasks = [{ path: "foo" }, { path: "bar" }];
    var secondTasks = [{ path: "baz" }];
    var completed = [];

    this.queue.add("first_blogID", firstTasks);
    this.queue.add("second_blogID", secondTasks);

    this.queue.process(function (blogID, task, callback) {
      setTimeout(function () {
        completed.push(task);
        callback();

        if (completed.length === 3) {
          expect(completed).toEqual([
            firstTasks[0],
            secondTasks[0],
            firstTasks[1],
          ]);
          done();
        }
      }, 100);
    });
  });

  it("processes tasks for many blogs in fair order", function (done) {
    var test = this;
    var blogs = [];
    var totalBlogs = 25;
    var totalTasks = 5;
    var expectedOrder = [];
    var checked = 0;
    var order = [];

    for (let i = 0; i < totalBlogs; i++) {
      let tasks = [];
      for (let x = 0; x < totalTasks; x++) {
        tasks.push({
          path: global.test.fake.path(),
        });
      }
      blogs.push(tasks);
    }

    for (let y = 0; y < totalTasks; y++)
      for (let z = 0; z < totalBlogs; z++)
        expectedOrder.push(z + ":" + blogs[z][y].path);

    async.eachOfSeries(
      blogs,
      function (tasks, index, next) {
        test.queue.add(index, tasks, next);
      },
      function () {
        test.queue.process(function (blogID, task, callback) {
          order.push(blogID + ":" + task.path);
          checked++;
          callback();

          if (checked === blogs.length * blogs[0].length) {
            expect(order).toEqual(expectedOrder);
            return done();
          }
        });
      }
    );
  });

  it("does not error if no task exists", function (done) {
    this.queue.process(function (blogID, task, callback) {
      callback();
    });
    done();
  });

  it("stores only the last thousand tasks on completed list", function (done) {
    let completed_tasks = [];
    let tasks = [];
    for (let i = 1; i <= 1200; i++) tasks.push({ id: i });

    let lastThousandTasks = tasks.slice().reverse().slice(0, 1000);

    this.queue.process((blogID, task, done) => {
      setTimeout(() => {
        completed_tasks.push(task);
        done();
      }, 1);
    });

    this.queue.drain((blogID) => {
      expect(completed_tasks).toEqual(tasks);
      this.queue.inspect((err, res) => {
        expect(res.blog.ended).toEqual(lastThousandTasks);
        done();
      });
    });

    this.queue.add("blog", tasks);
  }, 6000);

  it("processes one task at a time", function (done) {
    let flag = false;
    let completed_tasks = [];
    let tasks = [];

    for (let i = 1; i <= 30; i++) tasks.push({ id: i });

    this.queue.process((blogID, task, done) => {
      expect(flag).toEqual(false);
      flag = true;
      setTimeout(() => {
        expect(flag).toEqual(true);
        flag = false;
        completed_tasks.push(task);
        done();
      }, Math.random() * 100);
    });

    this.queue.drain((blogID) => {
      expect(completed_tasks).toEqual(tasks);
      done();
    });

    this.queue.add("blog", tasks);
  });

  it("distributes tasks across reliable task runners", function (done) {
    let tasks = [
      { path: "foo" },
      { path: "bar" },
      { path: "baz" },
      { path: "bat" },
      { path: "tat" },
    ];

    this.createWorkers({
      count: 3,
      module: "./workers/reliable.js",
      onRestart: () => {
        done.fail();
      },
    });

    this.queue.add(this.blog.id, tasks);

    this.queue.drain((blogID) => {
      expect(blogID).toEqual(this.blog.id);
      this.queue.inspect((err, res) => {
        expect(res[this.blog.id].active).toEqual([]);
        expect(res[this.blog.id].queued).toEqual([]);
        expect(res.sources).toEqual([]);
        done();
      });
    });
  });

  it("preserves processing order per-blog when using multiple workers", function (done) {
    this.createWorkers({
      count: 5,
      module: "./workers/variable-speed.js",
    });

    let tasks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    this.queue.add("a", tasks);
    this.queue.add("b", tasks);
    this.queue.add("c", tasks);

    let checked = [];
    this.queue.drain((blogID) => {
      this.queue.inspect((err, res) => {
        expect(res[blogID].ended.reverse()).toEqual(tasks);
        expect(res[blogID].active).toEqual([]);
        expect(res[blogID].queued).toEqual([]);
        expect(res.sources).toEqual([]);
        checked.push(blogID);

        if (checked.length === 3) {
          expect(checked).toContain("a");
          return done();
        }
      });
    });
  });

  it("distributes tasks across unreliable workers", function (done) {
    let tasks = [1, 2, 3];

    this.createWorkers({
      count: 3,
      module: "./workers/unreliable.js",
      // onRestart: () => {
      // 	this.queue.reset();
      // },
    });

    this.queue.add(this.blog.id, tasks);

    this.queue.drain((blogID) => {
      expect(blogID).toEqual(this.blog.id);
      this.queue.inspect((err, res) => {
        expect(res[this.blog.id].ended.sort()).toEqual(tasks.sort());
        expect(res[this.blog.id].active).toEqual([]);
        expect(res[this.blog.id].queued).toEqual([]);
        expect(res.sources).toEqual([]);
        done();
      });
    });
  });
});
