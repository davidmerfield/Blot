var async = require("async");
var Tags = require("./index");
var blogID = "10000";

function makeTag() {
  return Math.random()
    .toString(36)
    .toUpperCase();
}

function makeEntry(id) {
  var tags = [];
  var totalTags = Math.ceil(Math.random() * 10);

  while (tags.length < totalTags) tags.push(makeTag());

  return {
    id: id,
    tags: tags
  };
}

function makeEntries(total) {
  var res = [];

  while (res.length <= total) {
    res.push(makeEntry(res.length + 1));
  }

  return res;
}

var entries = makeEntries(2);

console.time("All entries set!");

async.eachSeries(
  entries,
  function(entry, next) {
    Tags.set(blogID, entry, next);
  },
  function() {
    console.timeEnd("All entries set!");
    console.time("All tags retrieved!");

    Tags.list(blogID, function(err, tags) {
      console.timeEnd("All tags retrieved!");
    });
  }
);

// Tags.list(blogID, function (err, tags) {

//   if (err) throw err;

//   if (tags) console.log(tags);

//   Tags.set(blogID, firstEntry, function(err){

//     if (err) throw err;

//   Tags.set(blogID, secondEntry, function(err){

//     if (err) throw err;

//     Tags.list(blogID, function (err, tags) {

//       if (err) throw err;

//       if (tags) console.log(tags);

//       firstEntry.deleted = true;

//       Tags.set(blogID, firstEntry, function(err){

//         if (err) throw err;

//         Tags.list(blogID, function (err, tags) {

//           if (err) throw err;

//           if (tags) console.log(tags);

//         });
//       });
//     });
//   });
//   });
// });
