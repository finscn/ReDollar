"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GestureUtils_1 = require("./GestureUtils");
class GestureStore {
    constructor() {
        this.reset();
    }
    reset() {
        this.gesturePool = {};
    }
    addGesture(name, gesture) {
        if (!Array.isArray(gesture)) {
            gesture = gesture.vectorize();
        }
        const pool = this.gesturePool[name] = this.gesturePool[name] || [];
        pool.push(gesture);
    }
    removeGesture(name) {
        delete this.gesturePool[name];
    }
    recognize(gesture, sim, threshold, first) {
        if (!Array.isArray(gesture)) {
            gesture = gesture.vectorize();
        }
        let minDis = threshold;
        let match = null;
        for (const name in this.gesturePool) {
            const gestures = this.gesturePool[name];
            for (let i = 0, len = gestures.length; i < len; i++) {
                const v = gestures[i];
                let d = Infinity;
                switch (sim) {
                    case GestureUtils_1.Similarity.Euclidean:
                        d = GestureUtils_1.default.euclideanDistanceSquared(v, gesture);
                        break;
                    case GestureUtils_1.Similarity.Cos:
                        d = GestureUtils_1.default.cosineDistance(v, gesture);
                        break;
                    case GestureUtils_1.Similarity.OptimalCos:
                        d = GestureUtils_1.default.minimumCosineDistance(v, gesture);
                        break;
                }
                if (d < minDis) {
                    minDis = d;
                    match = name;
                    if (first) {
                        return match;
                    }
                }
            }
        }
        return match;
    }
}
exports.default = GestureStore;
