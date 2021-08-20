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
