(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GesturePool {
    constructor() {
        this.reset();
    }
    static getInstance() {
        if (!this._instance) {
            this._instance = new GesturePool();
        }
        return this._instance;
    }
    reset() {
        this.cache = {};
    }
    addGesture(name, gesture) {
        if (!Array.isArray(gesture)) {
            gesture.vectorize();
            gesture = gesture.vector;
        }
        const pool = this.cache[name] = this.cache[name] || [];
        pool.push(gesture);
    }
    getGesture(name) {
        return this.cache[name];
    }
    getAllGestureNames() {
        return Object.keys(this.cache);
    }
    removeGesture(name) {
        delete this.cache[name];
    }
    forEachGesture(func, useSome = false) {
        const cache = this.cache;
        for (const name in cache) {
            const gestures = cache[name];
            for (let i = 0, len = gestures.length; i < len; i++) {
                const vector = gestures[i];
                const result = func(name, vector, i);
                if (useSome && result) {
                    return true;
                }
            }
        }
        return false;
    }
}
exports.default = GesturePool;
GesturePool._instance = null;

},{}],2:[function(require,module,exports){
"use strict";
// export interface Point {
//     x: number,
//     y: number
// }
Object.defineProperty(exports, "__esModule", { value: true });
const GestureUtils_1 = require("./GestureUtils");
class GestureStroke {
    constructor() {
        this.pointCount = 16;
        // rotateOBB = false // rotateOBB or rotateIndicativeAngle
        this.orientationCount = 1;
        this.ratioSensitive = false;
        this.scaledSize = 200;
        // useAngleInvariance
        // useBoundedRotationInvariance
        this.id = null;
    }
    init(inputPoints) {
        this.inputPoints = inputPoints;
        this.scaled = false;
        this.resampled = false;
        this.translated = false;
        this.rotated = false;
    }
    transform() {
        this.scale();
        this.resample();
        this.translate();
        this.rotate();
    }
    scale(afterResample = false) {
        if (this.ratioSensitive) {
            return;
        }
        const points = afterResample ? this.points : this.inputPoints;
        // 计算AABB/OBB
        this.aabb = GestureUtils_1.default.computeAABB(points);
        const width = this.aabb[2];
        const height = this.aabb[3];
        // 缩放AABB/OBB
        const scaleX = this.scaledSize / width;
        const scaleY = this.scaledSize / height;
        GestureUtils_1.default.scale(points, scaleX, scaleY);
        this.scaled = true;
    }
    resample() {
        const inputPoints = this.inputPoints;
        const sampleCount = this.pointCount;
        const outputPoints = this.points = this.points || [];
        outputPoints.length = 0;
        const length = this.computeLength(inputPoints);
        const count = inputPoints.length;
        const increment = length / (sampleCount - 1);
        let lastX = inputPoints[0][0];
        let lastY = inputPoints[0][1];
        let distanceSoFar = 0;
        outputPoints.push([lastX, lastY]);
        for (let i = 1; i < count;) {
            const currentX = inputPoints[i][0];
            const currentY = inputPoints[i][1];
            const deltaX = currentX - lastX;
            const deltaY = currentY - lastY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (distanceSoFar + distance >= increment) {
                const ratio = (increment - distanceSoFar) / distance;
                const nx = lastX + ratio * deltaX;
                const ny = lastY + ratio * deltaY;
                lastX = nx;
                lastY = ny;
                distanceSoFar = 0;
                outputPoints.push([nx, ny]);
            }
            else {
                lastX = currentX;
                lastY = currentY;
                distanceSoFar += distance;
                i++;
            }
        }
        for (let i = outputPoints.length; i < sampleCount; i++) {
            outputPoints.push([lastX, lastY]);
        }
        this.resampled = true;
    }
    translate() {
        // 移到原点
        this.centroid = this.computeCentroid();
        GestureUtils_1.default.translate(this.points, -this.centroid[0], -this.centroid[1]);
        this.translated = true;
    }
    rotate() {
        // 旋转
        this.angle = this.computeAngle();
        GestureUtils_1.default.rotate(this.points, -this.angle);
        this.rotated = true;
    }
    computeLength(inputPoints) {
        let d = 0;
        let p0 = inputPoints[0];
        let p1;
        const count = inputPoints.length;
        for (let i = 1; i < count; i++) {
            p1 = inputPoints[i];
            const dx = p1[0] - p0[0];
            const dy = p1[1] - p0[1];
            d += Math.sqrt(dx * dx + dy * dy);
            p0 = p1;
        }
        return d;
    }
    computeCentroid() {
        return GestureUtils_1.default.computeCentroid(this.points);
    }
    computeAngle(centroid) {
        centroid = centroid || [0, 0];
        const first = this.points[0];
        let angle = Math.atan2(first[1] - centroid[0], first[0] - centroid[1]);
        if (this.orientationCount > 1) {
            const TWO_PI = Math.PI * 2;
            if (angle < 0) {
                angle = TWO_PI + angle;
            }
            const sector = TWO_PI / this.orientationCount;
            console.log(sector * 180 / Math.PI, angle * 180 / Math.PI);
            const baseOrientation = Math.round(angle / sector) * sector;
            // const baseOrientation = r * Math.floor((angle + r / 2) / r)
            angle = angle - baseOrientation;
            console.log(baseOrientation * 180 / Math.PI, angle * 180 / Math.PI);
        }
        return angle;
    }
    vectorize() {
        if (!this.points) {
            return;
        }
        const vector = this.vector = this.vector || [];
        vector.length = 0;
        let sum = 0;
        let count = this.pointCount;
        for (let i = 0; i < count; i++) {
            const p = this.points[i];
            const x = p[0];
            const y = p[1];
            vector.push(x);
            vector.push(y);
            sum += x * x + y * y;
        }
        const magnitude = Math.sqrt(sum);
        count <<= 1;
        for (let i = 0; i < count; i++) {
            vector[i] /= magnitude;
        }
    }
}
exports.default = GestureStroke;

},{"./GestureUtils":3}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Similarity = void 0;
var Similarity;
(function (Similarity) {
    Similarity[Similarity["Euclidean"] = 0] = "Euclidean";
    Similarity[Similarity["Cos"] = 1] = "Cos";
    Similarity[Similarity["OptimalCos"] = 2] = "OptimalCos";
})(Similarity = exports.Similarity || (exports.Similarity = {}));
class GestureUtils {
    constructor() {
    }
    static rotate(points, angle) {
        const count = points.length;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        for (let i = 0; i < count; i++) {
            const p = points[i];
            const x = p[0] * cos - p[1] * sin;
            const y = p[0] * sin + p[1] * cos;
            p[0] = x;
            p[1] = y;
        }
        return points;
    }
    static translate(points, dx, dy) {
        const count = points.length;
        for (let i = 0; i < count; i++) {
            const p = points[i];
            p[0] += dx;
            p[1] += dy;
        }
        return points;
    }
    static scale(points, sx, sy) {
        const count = points.length;
        for (let i = 0; i < count; i++) {
            const p = points[i];
            p[0] *= sx;
            p[1] *= sy;
        }
        return points;
    }
    static euclideanDistanceSquared(vector1, vector2) {
        let squaredDistance = 0;
        const size = vector1.length;
        for (let i = 0; i < size; i++) {
            const difference = vector1[i] - vector2[i];
            squaredDistance += difference * difference;
        }
        return squaredDistance / size;
    }
    static cosineDistance(vector1, vector2) {
        let sum = 0;
        const len = vector1.length;
        for (let i = 0; i < len; i++) {
            sum += vector1[i] * vector2[i];
        }
        return Math.acos(sum);
    }
    static minimumCosineDistance(vector1, vector2, numOrientations) {
        const len = vector1.length;
        let a = 0;
        let b = 0;
        for (let i = 0; i < len; i += 2) {
            a += vector1[i] * vector2[i] + vector1[i + 1] * vector2[i + 1];
            b += vector1[i] * vector2[i + 1] - vector1[i + 1] * vector2[i];
        }
        if (a === 0) {
            return Math.PI / 2;
        }
        const tan = b / a;
        const angle = Math.atan(tan);
        if (numOrientations > 2 && Math.abs(angle) >= Math.PI / numOrientations) {
            return Math.acos(a);
        }
        const cosine = Math.cos(angle);
        const sine = cosine * tan;
        return Math.acos(a * cosine + b * sine);
    }
    static computeCoVariance(points) {
        const array = [
            [0, 0],
            [0, 0]
        ];
        const count = points.length;
        for (let i = 0; i < count; i += 1) {
            const x = points[i][0];
            const y = points[i][1];
            array[0][0] += x * x;
            array[0][1] += x * y;
            array[1][0] = array[0][1];
            array[1][1] += y * y;
        }
        array[0][0] /= count;
        array[0][1] /= count;
        array[1][0] /= count;
        array[1][1] /= count;
        return array;
    }
    static computeOrientation(covarianceMatrix) {
        const targetVector = [];
        if (covarianceMatrix[0][1] === 0 || covarianceMatrix[1][0] === 0) {
            targetVector[0] = 1;
            targetVector[1] = 0;
        }
        const a = -covarianceMatrix[0][0] - covarianceMatrix[1][1];
        const b = covarianceMatrix[0][0] * covarianceMatrix[1][1]
            - covarianceMatrix[0][1] * covarianceMatrix[1][0];
        const value = a / 2;
        const rightside = Math.sqrt(Math.pow(value, 2) - b);
        const lambda1 = -value + rightside;
        const lambda2 = -value - rightside;
        if (lambda1 === lambda2) {
            targetVector[0] = 0;
            targetVector[1] = 0;
        }
        else {
            const lambda = lambda1 > lambda2 ? lambda1 : lambda2;
            targetVector[0] = 1;
            targetVector[1] = (lambda - covarianceMatrix[0][0]) / covarianceMatrix[0][1];
        }
        return targetVector;
    }
    static computeOBB(points) {
        const array = this.computeCoVariance(points);
        const targetVector = this.computeOrientation(array);
        let angle;
        if (targetVector[0] === 0 && targetVector[1] === 0) {
            angle = -Math.PI / 2;
        }
        else { // -PI < alpha < PI
            angle = Math.atan2(targetVector[1], targetVector[0]);
            this.rotate(points, -angle);
        }
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;
        const count = points.length;
        for (let i = 0; i < count; i++) {
            const p = points[i];
            if (p[0] < minX) {
                minX = p[0];
            }
            if (p[0] > maxX) {
                maxX = p[0];
            }
            if (p[1] < minY) {
                minY = p[1];
            }
            if (p[1] > maxY) {
                maxY = p[1];
            }
        }
        return [
            angle,
            maxX - minX,
            maxY - minY
        ];
    }
    static computeCentroid(points) {
        let x = 0;
        let y = 0;
        const count = points.length;
        for (let i = 0; i < count; i++) {
            x += points[i][0];
            y += points[i][1];
        }
        x /= count;
        y /= count;
        return [x, y];
    }
    static computeAABB(points) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (let i = 0, len = points.length; i < len; i++) {
            const p = points[i];
            minX = Math.min(minX, p[0]);
            maxX = Math.max(maxX, p[0]);
            minY = Math.min(minY, p[1]);
            maxY = Math.max(maxY, p[1]);
        }
        return [
            minX,
            minY,
            maxX - minX,
            maxY - minY
        ];
    }
    static computeIndicativeAngle(originalPoint, rotationInvariance) {
        let angle;
        if (originalPoint[0] === 0 && originalPoint[1] === 0) {
            angle = -Math.PI / 2;
        }
        else {
            angle = Math.atan2(originalPoint[1], originalPoint[0]);
        }
        if (rotationInvariance) {
            const r = rotationInvariance;
            const baseOrientation = r * Math.floor((angle + r / 2) / r);
            return angle - baseOrientation;
        }
        return angle;
    }
    static computeScale(aabb, width, height, ratio1D = 0.3) {
        // keepAspectRatio
        height = height || width;
        if (ratio1D) {
            const longSide = Math.max(aabb[2], aabb[3]);
            const shortSide = Math.min(aabb[2], aabb[3]);
            const uniformly = shortSide / longSide < ratio1D;
            if (uniformly) {
                const scaleX = width / longSide;
                const scaleY = height / longSide;
                return [scaleX, scaleY];
            }
        }
        const scaleX = width / aabb[2];
        const scaleY = height / aabb[3];
        return [scaleX, scaleY];
    }
}
exports.default = GestureUtils;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GesturePool_1 = require("./GesturePool");
const GestureStroke_1 = require("./GestureStroke");
const GestureUtils_1 = require("./GestureUtils");
class GestureTool {
    constructor() {
        this.saveKey = "GesturePool";
        this.similarity = GestureUtils_1.Similarity.OptimalCos;
        this.threshold = 0.2;
        this.pointCount = 16;
        this.orientationCount = 8;
        this.ratioSensitive = false;
        this.scaledSize = 200;
        this.gesturePool = GesturePool_1.default.getInstance();
    }
    createGesture(points) {
        const stroke = new GestureStroke_1.default();
        stroke.pointCount = this.pointCount;
        stroke.orientationCount = this.orientationCount;
        stroke.ratioSensitive = this.ratioSensitive;
        stroke.scaledSize = this.scaledSize;
        stroke.init(points);
        return stroke;
    }
    addGesture(name, gesture) {
        this.gesturePool.addGesture(name, gesture);
    }
    getGesture(name) {
        return this.gesturePool.getGesture(name);
    }
    getAllGestureNames() {
        return this.gesturePool.getAllGestureNames();
    }
    removeGesture(name) {
        return this.gesturePool.removeGesture(name);
    }
    removeAllGestures() {
        return this.gesturePool.reset();
    }
    saveGestures() {
        const str = this.gesturePool.cache ? JSON.stringify(this.gesturePool.cache) : "";
        window.localStorage.setItem(this.saveKey, str);
    }
    loadGestures() {
        const str = window.localStorage.getItem(this.saveKey);
        if (str) {
            this.gesturePool.cache = JSON.parse(str);
        }
    }
    recognize(gesture, first = false) {
        if (!Array.isArray(gesture)) {
            gesture.vectorize();
            gesture = gesture.vector;
        }
        let minDis = Infinity;
        let match = null;
        this.gesturePool.forEachGesture((name, vector, index) => {
            let d = Infinity;
            switch (this.similarity) {
                case GestureUtils_1.Similarity.Euclidean:
                    d = GestureUtils_1.default.euclideanDistanceSquared(vector, gesture);
                    break;
                case GestureUtils_1.Similarity.Cos:
                    d = GestureUtils_1.default.cosineDistance(vector, gesture);
                    break;
                case GestureUtils_1.Similarity.OptimalCos:
                    d = GestureUtils_1.default.minimumCosineDistance(vector, gesture);
                    break;
            }
            console.log(name, d);
            if (d < minDis) {
                minDis = d;
                match = name;
                if (first && minDis <= this.threshold) {
                    return true;
                }
            }
        }, true);
        return {
            success: minDis <= this.threshold,
            gesture: match,
            distance: minDis
        };
    }
}
window['GestureStore'] = GesturePool_1.default;
window['GestureUtils'] = GestureUtils_1.default;
window['Polyline'] = GestureStroke_1.default;
window['GestureTool'] = GestureTool;
window['Similarity'] = GestureUtils_1.Similarity;

},{"./GesturePool":1,"./GestureStroke":2,"./GestureUtils":3}]},{},[4]);
