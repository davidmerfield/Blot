/*
 * mimer
 * https://github.com/heldr/mimer
 *
 * Copyright (c) 2013 Helder Santana
 * Licensed under the MIT license.
 * https://raw.github.com/heldr/mimer/master/MIT-LICENSE.txt
 */

(function (root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Mimer = factory();
    }
}(this, function () {
    'use strict';

    var Mimer = function (extPath) {
        if (!(this instanceof Mimer)) {
            if (extPath) {
                var mime = new Mimer();
                return mime.get(extPath);
            }
            return new Mimer();
        }
    },
    _extGetter = (typeof process !== 'undefined' && process.platform === 'win32') ? require('./extensions/getter') : function (path) {
        var last        = null,
            splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;

        if (!path.match('.')) {
            return path;
        }

        path = splitPathRe.exec(path).slice(1);
        last = path[path.length - 1];

        return (last !== '') ? last : path[path.length - 2];
    };

    Mimer.prototype = {
        set: function (ext, type) {
            if (!(ext instanceof Array)) {
                if (ext.match('.')) {
                    ext = ext.replace('.', '');
                }
                this.list[ext] = type;
                return this;
            } else {
                for (var i = 0; i < ext.length; i++) {
                    this.set(ext[i], type);
                }
            }
        },
        get: function (path) {
            var ext     = null,
                generic = 'application/octet-stream';

            if (!path) {
                return generic;
            }

            ext = _extGetter(path).split('.')[1];

            return this.list[ext] || generic;
        },
        list: (typeof process !== 'undefined' && process.cwd) ? require('./data/parser')(__dirname + '/data/mime.types') : $_MIMER_DATA_LIST
    };

    return Mimer;
}));
