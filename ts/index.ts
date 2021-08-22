import GesturePool from "./GesturePool"
import GestureStroke, { Point } from "./GestureStroke"
import GestureUtils, { Similarity } from "./GestureUtils"

class GestureTool {

    saveKey = "GesturePool"

    similarity = Similarity.OptimalCos

    threshold = 0.2

    pointCount = 16
    orientationCount = 8
    ratioSensitive = false
    scaledSize = 200

    gesturePool: GesturePool

    constructor() {
        this.gesturePool = GesturePool.getInstance()
    }

    createGesture(points: Point[]) {
        const stroke = new GestureStroke()
        stroke.pointCount = this.pointCount
        stroke.orientationCount = this.orientationCount
        stroke.ratioSensitive = this.ratioSensitive
        stroke.scaledSize = this.scaledSize

        stroke.init(points)

        return stroke
    }

    addGesture(name: string, gesture: number[] | GestureStroke) {
        this.gesturePool.addGesture(name, gesture)
    }

    getGesture(name: string) {
        return this.gesturePool.getGesture(name)
    }

    getAllGestureNames() {
        return this.gesturePool.getAllGestureNames()
    }

    removeGesture(name: string) {
        return this.gesturePool.removeGesture(name)
    }

    removeAllGestures() {
        return this.gesturePool.reset()
    }

    saveGestures() {
        const str = this.gesturePool.cache ? JSON.stringify(this.gesturePool.cache) : ""
        window.localStorage.setItem(this.saveKey, str)
    }

    loadGestures() {
        const str = window.localStorage.getItem(this.saveKey)
        if (str) {
            this.gesturePool.cache = JSON.parse(str)
        }
    }

    recognize(gesture: number[] | GestureStroke, threshold: number = this.threshold, first: boolean = false) {
        if (!Array.isArray(gesture)) {
            (gesture as GestureStroke).vectorize()
            gesture = (gesture as GestureStroke).vector
        }

        let minDis = threshold
        let match = null
        this.gesturePool.forEachGesture((name: string, vector: number[], index: number) => {
            let d: number = Infinity
            switch (this.similarity) {
                case Similarity.Euclidean:
                    d = GestureUtils.euclideanDistanceSquared(vector, (gesture as number[]))
                    break
                case Similarity.Cos:
                    d = GestureUtils.cosineDistance(vector, (gesture as number[]))
                    break
                case Similarity.OptimalCos:
                    d = GestureUtils.minimumCosineDistance(vector, (gesture as number[]))
                    break
            }

            console.log(name, d)
            if (d < minDis) {
                minDis = d
                match = name
                if (first) {
                    return true
                }
            }
        }, true)

        return match
    }
}

window['GestureStore'] = GesturePool
window['GestureUtils'] = GestureUtils
window['Polyline'] = GestureStroke
window['GestureTool'] = GestureTool
window['Similarity'] = Similarity

