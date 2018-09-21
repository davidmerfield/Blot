module.exports = function(done){

    var User = require('../../app/models/user');
    var uid = global.user.uid;
    
    delete global.user;

    User.remove(uid, done);
};