
// export interface Point {
//     x: number,
//     y: number
// }

import GestureUtils from "./GestureUtils"

export type Point = [number, number]

const TWO_PI = Math.PI * 2

export default class GestureStroke {

    sampleCount = 16

    scaleOBB = true
    orientationCount = 1

    ratioSensitive = false
    scaledSize = 200

    // useAngleInvariance
    // useBoundedRotationInvariance

    id: string = null

    inputPoints: Point[]
    points: Point[]
    centroid: Point
    angle: number

    vector: number[]

    scaled: boolean
    resampled: boolean
    translated: boolean
    rotated: boolean

    init(inputPoints: Point[]) {
        this.inputPoints = inputPoints
        this.scaled = false
        this.resampled = false
        this.translated = false
        this.rotated = false
    }

    transform() {
        this.translate()
        if (this.scaleOBB) {
            this.scale()
            this.rotate()
        } else {
            this.rotate()
            this.scale()
        }
        this.resample()
    }

    translate() {
        let inputPoints: Point[]
        let outputPoints: Point[]
        if (!this.points) {
            inputPoints = this.inputPoints
            outputPoints = this.points = []
        } else {
            inputPoints = this.points
        }

        // 求质心
        this.centroid = GestureUtils.computeCentroid(inputPoints)
        // 移到原点
        GestureUtils.translate(inputPoints, -this.centroid[0], -this.centroid[1], outputPoints)

        this.translated = true
    }

    rotate() {

        // 旋转
        this.angle = this.computeAngle()
        GestureUtils.rotate(this.points, -this.angle)

        this.rotated = true
    }

    scale() {
        if (this.ratioSensitive) {
            return
        }

        const points = this.points

        // 计算AABB/OBB
        let width: number
        let height: number
        let angle: number = 0
        if (this.scaleOBB) {
            const obb = GestureUtils.computeOBB(points)
            angle = obb[0]
            width = obb[1]
            height = obb[2]
            console.log(obb)
        } else {
            const aabb = GestureUtils.computeAABB(points)
            width = aabb[2]
            height = aabb[3]
        }


        // 缩放AABB/OBB
        const scaleX = this.scaledSize / width
        const scaleY = this.scaledSize / height
        GestureUtils.scale(points, scaleX, scaleY)

        if (this.scaleOBB) {
            GestureUtils.rotate(points, angle)
        }

        this.scaled = true
    }

    resample() {
        const inputPoints = this.points || this.inputPoints
        this.points = GestureUtils.resample(inputPoints, this.sampleCount)
        this.resampled = true
    }

    computeAngle(centroid?: Point) {
        centroid = centroid || [0, 0]
        const first = this.points[0]
        let angle = Math.atan2(first[1] - centroid[0], first[0] - centroid[1])
        if (this.orientationCount > 1) {
            if (angle < 0) {
                angle = TWO_PI + angle
            }
            const sector = TWO_PI / this.orientationCount

            // console.log(sector * 180 / Math.PI, angle * 180 / Math.PI)
            const baseOrientation = Math.round(angle / sector) * sector
            angle = angle - baseOrientation
            // console.log(baseOrientation * 180 / Math.PI, angle * 180 / Math.PI)
        }
        return angle
    }

    vectorize() {
        if (!this.points) {
            return
        }

        const vector = this.vector = this.vector || []
        vector.length = 0

        let sum = 0
        let count = this.sampleCount
        for (let i = 0; i < count; i++) {
            const p = this.points[i]
            const x = p[0]
            const y = p[1]
            vector.push(x, y)
            sum += x * x + y * y
        }
        const magnitude = Math.sqrt(sum)
        count <<= 1
        for (let i = 0; i < count; i++) {
            vector[i] /= magnitude
        }
    }
}


