"use strict";

(function(exports, undefined) {

    var ns = exports.RD = exports.RD || {};

    ns.applyDefaultOne = function(dollarOne) {
        for (var name in ns.DefaultOne) {
            var points = ns.DefaultOne[name];
            dollarOne.addGesture(name, new ns.Polyline(points));
        }
    };

    ns.DefaultOne = {
        // TODO
    };

}(typeof exports == "undefined" ? this : exports));

