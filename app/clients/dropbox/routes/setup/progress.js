const stages = [
  {
    stage: "getAccount",
    messages: {
      queued: "Waiting to load your Dropbox account information",
      active: "Loading your Dropbox account information",
      done: "Loaded your Dropbox account information",
    },
  },
  {
    stage: "createFolder",
    messages: {
      queued: "Waiting to create a folder in Dropbox for your blog",
      active: "Creating a folder in Dropbox for your blog",
      done: "Created a folder in Dropbox for your blog",
    },
  },
  {
    stage: "syncContents",
    messages: {
      queued: "Waiting to sync the contents of your blog folder to Dropbox",
      active: "Syncing the contents of your blog folder to Dropbox",
      done: "Synced the contents of your blog folder to Dropbox",
    },
  },
];

/*

{{#stages}}

<li id="{{stage}}" class="{{state}}">{{message}}</li>

{{/stages}}

*/

const progress = (session, emitStatus) => (stage) => {
  const activeIndex = stages.findIndex((item) => item.stage === stage);

  if (activeIndex === -1) throw new Error("There is no stage: " + stage);

  session.dropbox.stages = stages.map((item, i) => {
    item = { ...item };

    if (i === activeIndex) {
      item.state = "active";
      item.message = item.messages.active;
    } else if (i < activeIndex) {
      item.state = "done";
      item.message = item.messages.done;
    } else {
      item.state = "queued";
      item.message = item.messages.queued;
    }

    if (i + 1 === activeIndex || i === activeIndex) {
      emitStatus(item.message);
    }

    return item;
  });

  session.save();
};

progress.stages = () =>
  stages.map((item) => {
    return { ...item, state: "queued", message: item.messages.queued };
  });

module.exports = progress;
