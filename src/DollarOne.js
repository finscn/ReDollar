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

        threshold: 0.3,

        ratio1D: 0.2,
        rotationInvariance: Math.PI / 4,
        normalPointCount: 40,
        normalSize: 200,

        recognize: function(points, first) {
            var polyline = this.createPolyline(points);
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
        createPolyline: function(points) {
            var polyline = new Polyline(points);
            polyline.ratio1D = this.ratio1D;
            polyline.rotationInvariance = this.rotationInvariance;
            polyline.normalPointCount = this.normalPointCount;
            polyline.normalSize = this.normalSize;
            return polyline;
        },

        getGesture: function(name) {
            return this.gesturePool[name];
        },
        addGesture: function(name, points, transform) {
            var polyline = Array.isArray(points) ? this.createPolyline(points) : points;
            polyline.name = name;
            polyline.init(transform);
            this.gesturePool[name] = polyline;
        },
        removeGesture: function(name) {
            if (!name) {
                this.gesturePool = {};
                return;
            }
            delete this.gesturePool[name];
        }
    };


    for (var p in proto) {
        DollarOne.prototype[p] = proto[p];
    }


}(typeof exports == "undefined" ? this : exports));
