module.exports = function(done){

    var User = require('../../app/models/user');

    User.remove(global.test_uid, done);
};