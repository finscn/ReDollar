"use strict";

(function(exports, undefined) {

    var ns = exports.RD = exports.RD || {};

    var Polyline = ns.Polyline = function(points) {
        this.points = points || [];
    };

    var CONST = ns.CONST,
        Utils = ns.Utils;

    var proto = {
        constructor: Polyline,
        id: null,
        name: null,
        points: null,
        origPoints: null,
        rotationInvariance: 0,
        ratio1D: 0,
        init: function() {
            this.origPoints = this.points;
            this.points = Utils.resample(this.origPoints, CONST.normalPointCount);
            this.pointCount = this.points.length;

            this.firstPoint = this.points[0];
            this.aabb = Utils.getAABB(this.points);
            this.centroid = this.getCentroid();
            this.angle = this.indicativeAngle();
            this.translateTo(CONST.origin[0], CONST.origin[1]);
            this.rotateBy(-this.angle);
            this.scaleTo(CONST.normalSize);
            this.vector = this.vectorize();

        },

        indicativeAngle: function() {
            if (this.rotationInvariance) {
                var r = this.rotationInvariance;
                var iAngle = Math.atan2(this.firstPoint[1], this.firstPoint[0]);
                var baseOrientation = r * Math.floor((iAngle + r / 2) / r);
                return iAngle - baseOrientation;
            }
            return Math.atan2(this.firstPoint[1] - this.centroid[1], this.firstPoint[0] - this.centroid[0]);
        },

        length: function() {
            return Utils.polylineLength(this.points);
        },
        vectorize: function() {
            var sum = 0.0;
            var vector = [];
            var len = this.pointCount;
            for (var i = 0; i < len; i++) {
                var x = this.points[i][0],
                    y = this.points[i][1];
                vector.push(x);
                vector.push(y);
                sum += x * x + y * y;
            }
            var magnitude = Math.sqrt(sum);
            len <<= 1;
            for (var i = 0; i < len; i++) {
                vector[i] /= magnitude;
            }
            return vector;
        },
        getCentroid: function() {
            var x = 0,
                y = 0;
            for (var i = 0; i < this.pointCount; i++) {
                x += this.points[i][0];
                y += this.points[i][1];
            }
            x /= this.pointCount;
            y /= this.pointCount;
            return [x, y];
        },
        translateTo: function(x, y) {
            var c = this.centroid;
            for (var i = 0; i < this.pointCount; i++) {
                var p = this.points[i];
                var qx = p[0] - c[0] + x;
                var qy = p[1] - c[1] + y;
                p[0] = qx;
                p[1] = qy;
            }
        },

        rotateBy: function(radians) {
            var cos = Math.cos(radians);
            var sin = Math.sin(radians);
            for (var i = 0; i < this.pointCount; i++) {
                var p = this.points[i];
                var qx = p[0] * cos - p[1] * sin;
                var qy = p[0] * sin + p[1] * cos;
                p[0] = qx;
                p[1] = qy;
            }
        },
        scale: function(scaleX, scaleY) {
            for (var i = 0; i < this.pointCount; i++) {
                var p = this.points[i];
                var qx = p[0] * scaleX;
                var qy = p[1] * scaleY;
                p[0] = qx;
                p[1] = qy;
            }
        },
        scaleTo: function(width, height) {
            height = height || width;
            var aabb = this.aabb;
            if (this.ratio1D) {
                var longSide = Math.max(aabb[4], aabb[5]);
                var shortSide = Math.min(aabb[4], aabb[5]);
                var uniformly = shortSide / longSide < this.ratio1D;
                if (uniformly) {
                    var scaleX = width / longSide,
                        scaleY = height / longSide;
                    return this.scale(scaleX, scaleY);
                }
            }
            var scaleX = width / aabb[4],
                scaleY = height / aabb[5];
            this.scale(scaleX, scaleY);
        },
    };


    for (var p in proto) {
        Polyline.prototype[p] = proto[p];
    }


}(typeof exports == "undefined" ? this : exports));
