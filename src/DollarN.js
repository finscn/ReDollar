"use strict";

(function(exports, undefined) {

    var ns = exports.RD = exports.RD || {};

    var DollarN = ns.DollarN = function(cfg) {

        for (var property in cfg) {
            this[property] = cfg[property];
        }

    };

    var proto = {
        constructor: DollarN,

        threshold: 0.25,
        rotationInvariance: 0,

        recognize: function(points) {
            // TODO 
        },

    };

    var superProto=DollarOne.prototype;
    for (var p in superProto) {
        DollarN.prototype[p] = superProto[p];
    }
    for (var p in proto) {
        DollarN.prototype[p] = proto[p];
    }

}(typeof exports == "undefined" ? this : exports));
