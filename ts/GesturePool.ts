import GestureStroke from "./GestureStroke"

export default class GesturePool {

    static _instance: GesturePool = null

    static getInstance() {
        if (!this._instance) {
            this._instance = new GesturePool()
        }
        return this._instance
    }

    cache: {
        [name: string]: number[][]
    }

    private constructor() {
        this.reset()
    }

    reset() {
        this.cache = {}
    }

    addGesture(name: string, gesture: number[] | GestureStroke) {
        if (!Array.isArray(gesture)) {
            (gesture as GestureStroke).vectorize()
            gesture = (gesture as GestureStroke).vector
        }
        const pool = this.cache[name] = this.cache[name] || []
        pool.push(gesture)
    }

    getGesture(name: string): number[][] {
        return this.cache[name]
    }

    getAllGestureNames() {
        return Object.keys(this.cache)
    }

    removeGesture(name: string) {
        delete this.cache[name]
    }

    forEachGesture(func: (name: string, vector: number[], index: number) => boolean | void, useSome = false) {
        const cache = this.cache
        for (const name in cache) {
            const gestures = cache[name]

            for (let i = 0, len = gestures.length; i < len; i++) {
                const vector = gestures[i]

                const result = func(name, vector, i)

                if (useSome && result) {
                    return true
                }
            }
        }
        return false
    }
}
