var fs = require('fs');
var testDir = __dirname + '/in';
var resultDir = __dirname + '/out';


fs.readdirSync(testDir).forEach(function(file){

  var parsed = {
    Tags: '',
    Date: '',
    Permalink: ''
  };

  // system files
  if (file.charAt(0) === '.') return false;

  var date = file.split('-').slice(0, 3);
      date = date[1] + '/' + date[2] + '/' + date[0];

  parsed.Date = date;

  var Title = '';

  var post = fs.readFileSync(testDir + '/' + file, 'utf-8');

  post = post.trim().split('---');

  if (post.length < 3) {
    console.log(post);
    console.log(post.length);
    throw 'BAD metadata';
  }

  var metadata = post[1].trim().split('\n');

  for (var i in metadata) {

    var line = metadata[i];

    var key = line.slice(0, line.indexOf(':')).trim().toLowerCase();
    var value = line.slice(line.indexOf(':') + 1).trim();

    if (key === 'categories' || key === 'tags' && value.slice(0, 1) === '[') value = value.slice(1);
    if (key === 'categories' || key === 'tags' && value.slice(-1) === ']') value = value.slice(0, -1);

    // console.log(key + ': ' + value);

    if (key === 'tags' || key === 'categories') {
      if (parsed.Tags === '') {
        parsed.Tags = value;
      } else {
        parsed.Tags += ', ' + value;
      }
    }

    if (key === 'title') Title = value;

    if (key === 'link' && Title) Title = '[' + Title + '](' + value + ')';

    if (key === 'permalink') parsed.Permalink = value;
  }

  var output = post.slice(2).join('---').trim();

  // console.log(output);

  if (Title) output = '# ' + Title + '\n\n' + output;

  var meta = '';

  // console.log(parsed);

  for (var i in parsed) {
    if (parsed[i]) meta += i + ': ' + parsed[i] + '\n';
  }

  // console.log(meta);

  if (meta) output = meta + '\n' + output;

  output = output.split("{% include JB/setup %}").join('');

  console.log(file);
  console.log(resultDir + '/' + file.split('-').slice(3).join('-'));
  fs.writeFileSync(resultDir + '/' + file, output, 'utf-8');
});
