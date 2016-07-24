var Template = require('../../models/template');
var helper = require('../../helper');

var extend = helper.extend;
var ensure = helper.ensure;
var fetchLocals = require('../retrieve');

var Augment = require('./augment');
var eachEntry = require('./eachEntry');

var _ = require('lodash');

// then we check each entry in the view

// we determine a new list of partials
// and locals to retrieve based on those entries

// and retrieve them
// merging them into the view

// then returning req and res

module.exports = function(req, res, callback) {

  ensure(req, 'object')
    .and(res, 'object')
    .and(callback, 'function');

  var blog = req.blog;
  var locals = res.locals;
  var partials = res.locals.partials;

  var missingLocals = {};
  var missingPartials = [];

  var augment = Augment(req, res);

  eachEntry(locals, function(entry){

    missingPartials = missingPartials.concat(entry.partials);

    extend(missingLocals)
      .and(entry.retrieve);

    return augment(entry);
  });

  // Dont retrieve missing locals twice!
  for (var x in missingLocals)
    if (locals[x] !== undefined)
      delete missingLocals[x];

  // Dont retrieve missing partials twice!
  missingPartials = _.uniq(missingPartials);

  missingPartials = missingPartials.filter(function(name){
    return partials[name] === undefined;
  });


  Template.getPartials(blog.id, blog.template, missingPartials, function(err, newPartials){

    fetchLocals(req, missingLocals, function (err, newLocals) {

      // drop empty string partials and locals here...
      // since extend preserves empty strings...
      dropEmptyStrings(res.locals.partials);

      extend(res.locals)
         .and(newLocals);

       extend(res.locals.partials)
          .and(newPartials);

      return callback(null, req, res);
    });
  });
};

function dropEmptyStrings(obj) {

  for (var i in obj)
    if (obj[i] === '')
      delete obj[i];

}