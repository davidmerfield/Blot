var static = __dirname + '/static';
var Express = require('express');
var Static = new Express.Router();

Static.use('/blot.*.css', require('./css'));
Static.use('/blot.*.js', require('./js'));

Static.use(require('./simple'));
Static.use('/updates', require('./updates'));
Static.use('/formatting', require('./formatting'));
Static.use('/', require('./help'));

// Serve static files too
Static.use(Express.static(static, {maxAge: 86400000}));

module.exports = Static;