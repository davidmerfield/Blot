var bplist = require('./bplist');

bplist.parseFile(__dirname + '/safari.webloc', function(err, obj) {

  if (err) throw err;

  console.log(JSON.stringify(obj));
});