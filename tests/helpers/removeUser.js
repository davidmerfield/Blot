module.exports = function(done){

    var User = require('../../app/models/user');

    User.remove(global.user.uid, done);
};