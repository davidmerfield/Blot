var ensure = require("./ensure");
var type = require("./type");
var arrayify = require("./arrayify");

// if (fields.menu) {

//   updates.menu = [];

//   for (var i in fields) {

//     if (i.slice(0, 6) === 'title_') {

//       var id = i.slice(6),
//           link = {
//             id: id,
//             url: fields['url_' + id],
//             label: fields[i]
//           };

//       if (link.url && link.label)
//         updates.menu.push(link);
//     }
//   }
// }

// how to implement some rudimentary type coercion?
// would be nice to coerce strings -> numbs
// and strings -> bools

function formJSON(fields, model) {
  // console.log(fields);
  // console.log(model);

  if (model === undefined) model = {};

  ensure(fields, "object").and(model, "object");

  var obj = {};

  for (var i in fields) {
    // Sometimes there are multiple values
    // for one field. Collapse them to one.
    if (type(fields[i]) === "array") {
      fields[i] = fields[i].pop();
      console.log("FormJSON: Multiple inputs with same name", i, fields[i]);
    }

    var terms = i.split("."),
      totalTerms = terms.length,
      val = fields[i];

    var parent = obj,
      modelDef = model;

    for (var j = 0; j < terms.length; j++) {
      var key = terms[j];

      // Recurse down the model tree too
      // until we reach a definition
      if (modelDef && modelDef[key]) {
        modelDef = modelDef[key];
      } else {
        modelDef = false;
      }

      parent[key] = parent[key] || {};

      // At the leaf node
      // final term in list of terms
      if (j + 1 === totalTerms) {
        // At lowest level of type definition
        // and the types do not match
        if (type(modelDef) === "string" && type(val) !== modelDef) {
          try {
            if (modelDef === "string") val += "";

            if (modelDef === "number") val = parseFloat(val);

            if (modelDef === "boolean") {
              if (val === "off") {
                val = false;
              } else if (val === "on") {
                val = true;
              } else {
                val = parseBool(val);
              }
            }

            if (modelDef === "object" || modelDef === "array")
              val = JSON.parse(val);
          } catch (e) {
            console.log(
              "Could not coerce val to desired " +
                modelDef +
                " it is currently: "
            );
            console.log(val);
            console.log();
            console.log(e);
          }
        }

        parent[key] = val;
      }

      parent = parent[key];
    }
  }

  function catchArrays(obj, model) {
    for (var i in obj) {
      // console.log(i);

      if (type(model[i]) === "array") {
        obj[i] = arrayify(obj[i], function(item) {
          // arrayidy adds cruft like the name property
          // make sure we remove anything thats not in the
          // model definition for this item
          for (var x in item)
            if (model[i][0][x] === undefined) {
              delete item[x];
            }

          // this fixes a bug with nested objects in arrays
          // and is neccessary for blog.menu
          if (!Object.keys(item).length) return false;

          return item;
        });
      }

      if (type(model[i]) === "object") {
        // console.log(obj[i]);
        // console.log(model[i]);

        catchArrays(obj[i], model[i]);
      }
    }
  }

  catchArrays(obj, model);

  ensure(obj, model);

  return obj;
}

function parseBool(string) {
  switch (string.trim().toLowerCase()) {
    case "true":
    case "yes":
    case "1":
      return true;
    case "false":
    case "no":
    case "0":
    case null:
      return false;
    default:
      return Boolean(string);
  }
}

function unitTests() {
  var assert = require("assert");

  var field1 = {
    "foo.baz": 1,
    "foo.bar": 2,
    "foo.bat.cat": 3,
    "foo.bat.bar": 4
  };

  var model1 = {
    foo: {
      baz: "number",
      bar: "number",
      bat: {
        cat: "number",
        bar: "string"
      }
    }
  };

  var result1 = {
    foo: {
      baz: 1,
      bar: 2,
      bat: {
        cat: 3,
        bar: "4"
      }
    }
  };

  // assert.deepEqual(formJSON(field1, model1), result1);

  var field2 = {
    "foo.bar.1.title": "Hello",
    "foo.bar.1.url": "Bye",
    "foo.bar.1.id": "1",
    "foo.bar.2.title": "OK",
    "foo.bar.2.url": "GO",
    "foo.bar.2.id": "2"
  };

  var model2 = {
    foo: {
      bar: [{ id: "string", title: "string", url: "string" }]
    }
  };

  var expected2 = {
    foo: {
      bar: [
        { title: "Hello", url: "Bye", id: "1" },
        { title: "OK", url: "GO", id: "2" }
      ]
    }
  };

  var resulted = {
    foo: {
      bar: [
        {
          title: "Hello",
          url: "Bye",
          id: "1"
        },
        {
          title: "OK",
          url: "GO",
          id: "2"
        }
      ]
    }
  };

  var result2 = formJSON(field2, model2);

  // console.log(JSON.stringify(result2));

  // assert.deepEqual(resulted, expected2);

  assert.deepEqual(result2, expected2);
}

module.exports = formJSON;
