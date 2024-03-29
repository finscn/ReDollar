import GesturePool from "./GesturePool"
import GestureStroke, { Point } from "./GestureStroke"
import GestureUtils, { Similarity } from "./GestureUtils"

class GestureTool {

    saveKey = "GesturePool"
    gesturePool: GesturePool

    similarity = Similarity.OptimalCos
    threshold = 0.2

    sampleCount = 16
    orientationCount = 8
    scaledSize = 200
    keepAspectRatio = false

    constructor() {
        this.gesturePool = GesturePool.getInstance()
    }

    createGesture(points: Point[]) {
        const stroke = new GestureStroke()
        stroke.sampleCount = this.sampleCount
        stroke.orientationCount = this.orientationCount
        stroke.scaledSize = this.scaledSize
        stroke.keepAspectRatio = this.keepAspectRatio

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

    recognize(gesture: number[] | GestureStroke, first = false): RecognizeResult {
        if (!Array.isArray(gesture)) {
            (gesture as GestureStroke).vectorize()
            gesture = (gesture as GestureStroke).vector
        }

        let minDis = Infinity
        let match = null
        this.gesturePool.forEachGesture((name: string, vector: number[], index: number) => {
            let d: number = Infinity
            switch (this.similarity) {
                case Similarity.Euclidean:
                    const points = vector as unknown as Point[]
                    d = GestureUtils.squaredEuclideanDistance(points, (gesture as GestureStroke).points)
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
                if (first && minDis <= this.threshold) {
                    return true
                }
            }
        }, true)

        return {
            success: minDis <= this.threshold,
            gesture: match,
            distance: minDis
        }
    }
}

interface RecognizeResult {
    success: boolean
    gesture: string
    distance: number
}

window['GesturePool'] = GesturePool
window['GestureUtils'] = GestureUtils
window['GestureStroke'] = GestureStroke
window['GestureTool'] = GestureTool
window['Similarity'] = Similarity

