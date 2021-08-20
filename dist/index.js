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
        this.scaleSize = 200;
        this.gesturePool = GesturePool_1.default.getInstance();
    }
    createGesture(points) {
        const stroke = new GestureStroke_1.default();
        stroke.pointCount = this.pointCount;
        stroke.orientationCount = this.orientationCount;
        stroke.ratioSensitive = this.ratioSensitive;
        stroke.scaleSize = this.scaleSize;
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
    recognize(gesture, threshold = this.threshold, first = false) {
        if (!Array.isArray(gesture)) {
            gesture.vectorize();
            gesture = gesture.vector;
        }
        let minDis = threshold;
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
            console.log(d);
            if (d < minDis) {
                minDis = d;
                match = name;
                if (first) {
                    return true;
                }
            }
        }, true);
        return match;
    }
}
window['GestureStore'] = GesturePool_1.default;
window['GestureUtils'] = GestureUtils_1.default;
window['Polyline'] = GestureStroke_1.default;
window['GestureTool'] = GestureTool;
