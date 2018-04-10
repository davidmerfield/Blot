var type = require('./type');

function str (len) {
  var res = '';
  while (res.length < len) res+= ' ';
  return res;
}

function printarr (arr, indent) {

  for (var i = 0;i < arr.length;i++) {

    var comma = i === arr.length - 1 ? '' : ',';
    var variable = arr[i];

    console.log(str(indent) + variable + comma, '(' + type(variable) + ') ');
  }

}

function print (obj, indent) {

  indent = indent || 1;

  if (indent === 1) console.log('{');

  for (var i in obj) {

    var comma = i === Object.keys(obj).slice(-1)[0] ? '' : ',';
    var variable = obj[i];

    if (type(variable, 'array')) {
      console.log(str(indent) + '"' + i + '": [');
      printarr(variable, indent + 2);
      console.log(str(indent) +']' + comma);
      continue;
    }

    if (type(variable, 'object')) {
      console.log(str(indent) + '"' + i + '": {');
      print(variable, indent + 2);
      console.log(str(indent) +'}' + comma);
      continue;
    }

    // Prepare variable for printing...
    if (type(variable, 'string')) {

      if (variable.length > 100) {
        variable = variable.slice(0, 100) + '...';
      }

      variable = '"' + variable + '"';
    }

    console.log(str(indent) + '"' + i + '":', variable + comma, '(' + type(variable) + ') ');

  }

  if (indent === 1) console.log('}');

}

function debug (param, is) {

  console.log();
  console.log('------------------------------------------');

  console.log('Expected:');

  print(is);
  console.log();

  console.log('Actual:');

  print(param);
  console.log();

  console.log('In summary object is:');

  for (var i in is) {

    if (param[i] === undefined) {

      console.log('- missing key "' + i + '" that is specified in the model with type "' + is[i] + '".');

      continue;
    }

    if (!type(param[i], is[i])) {

      console.log('- of wrong type for key "' + i + '" which should be type "' + is[i] + '".');

      continue;
    }

  }

  for (var x in param) {

    if (!is[x]) {
      console.log('- has key "' + x + '" that is not specified in the model.');
      continue;
    }

  }

  console.log('------------------------------------------');
  console.log();
}


function ensure (param, is, strictly, recursive) {

  if (type(is) === 'array') {

    for (var x in param) {
      ensure(param[x], is[0]);
    }

    return {and: ensure};
  }

  var deleted = [];

  if (type(is) === 'object') {

    try {

      for (var i in param) {

        if (is[i]) {
          ensure(param[i], is[i], strictly, true);
        } else {
          delete param[i];
          deleted.push(i);
        }

      }

      if (strictly)
        for (var j in is)
          ensure(param[j], is[j], strictly, true);


    } catch (e) {
      if (!recursive) debug(param, is);
      throw e;
    }

    if (deleted.length) {
      console.log('Removed extraneous keys ' + deleted.join(', '));
    }


  }

  else if (type(param) !== is)
      throw new TypeError('Param "' + param + '" must be a ' + is + '. Its type is ' + type(param));

  return {and: ensure};
}

function tests () {

  var assert = require('assert');

  var model = {
    a: [
      {b: 'string', c: 'number'}
    ],
    d: {g: {h: {i: [{j: 'string', k: 'number'}]}}}
  };

  var test = {
    a: [
      {b: 'x', c: 1},
      {b: 'y', c: 2},
      {b: 'z', c: 3}
    ],
    d: {g: {h: {i: [{j: '', k: 0}, {j: '', k: 2}]}}}
  };

  assert(ensure(test, model));

  var model2 = {a: {b: {c: 'string'}}};

  var test2 = {a: {b: {c: 1}}};

  assert.throws(function(){
    ensure(test2, model2);
  }, Error);

  var model3 = {a: [{b: 'number', d: [{e: 'string', f: 'number'}]}]};

  var test3 = {
    a: [
      {
        b: 1,
        d: [
          {e: '1', f: 2},
          {e: '2', f: 3},
          {e: '3', f: 4}
        ]
      },
      {
        b: 2,
        d: [
          {e: '3', f: 5},
          {e: '4', f: 6},
          {e: '5', f: 7}
        ]
      }
    ]
  };

  assert(ensure(test3, model3));


  var model4 = {a: 'string', b: 'number', c: 'boolean', d: {e: 'string'}};

  var test4  = {a: 'defghi', b: 12345555, c: '       '};

  assert.throws(function(){
    ensure(test4, model4);
  }, Error);


}

// tests();

module.exports = ensure;