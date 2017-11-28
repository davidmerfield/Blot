module.exports = function (ps, cb) {
    var pending = 3;
    var code, sig;
    
    function onend () {
        if (--pending === 0) cb(code, sig);
    }
    ps.on('exit', function (c, s) {
        code = c;
        sig = s;
    });
    ps.on('exit', onend);
    ps.stdout.on('end', onend);
    ps.stderr.on('end', onend);
};
