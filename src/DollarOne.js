"use strict";

(function(exports, undefined) {

    var ns = exports.RD = exports.RD || {};

    var DollarOne = ns.DollarOne = function(cfg) {

        for (var property in cfg) {
            this[property] = cfg[property];
        }
        this.gesturePool = this.gesturePool || {};

    };

    var CONST = ns.CONST,
        Utils = ns.Utils,
        Polyline = ns.Polyline;

    var proto = {
        constructor: DollarOne,

        threshold: Math.PI / 8,
        rotationInvariance: Math.PI / 4,

        recognize: function(points, first) {
            var polyline = new Polyline(points);
            polyline.rotationInvariance = this.rotationInvariance;
            polyline.init();
            var vector = polyline.vector;

            var minDis = this.threshold;
            var match = null;
            for (var name in this.gesturePool) {
                var gesture = this.gesturePool[name];
                var d = Utils.cosDistance(gesture.vector, vector);
                if (d < minDis) {
                    minDis = d;
                    match = name;
                    if (first) {
                        return match;
                    }
                }
            }
            // console.log(similarity);
            return match;
        },

        addGesture: function(name, polyline) {
            polyline.name = name;
            polyline.rotationInvariance = this.rotationInvariance;
            polyline.init();
            this.gesturePool[name] = polyline;
        },
        removeGesture: function(name) {
            delete this.gesturePool[name];
        }
    };


    for (var p in proto) {
        DollarOne.prototype[p] = proto[p];
    }


}(typeof exports == "undefined" ? this : exports));
