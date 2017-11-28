// randomly reject 50% of commits
var em = require('../')(__dirname + '/repo.git');

em.on('update', function (update) {
    if (Math.random() > 0.5) update.reject()
    else update.accept()
});
