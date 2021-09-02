
// export interface Point {
//     x: number,
//     y: number
// }

import GestureUtils from "./GestureUtils"

export type Point = [number, number]

const TWO_PI = Math.PI * 2

export default class GestureStroke {

    sampleCount = 16
    orientationCount = 1
    scaledSize = 200
    keepAspectRatio = false

    id: string = null

    inputPoints: Point[]
    points: Point[]
    centroid: Point

    aabb: number[]
    obb: number[]
    angle: number

    vector: number[]

    translated: boolean
    rotated: boolean
    scaled: boolean
    resampled: boolean
    vectorized: boolean

    init(inputPoints: Point[]) {
        this.inputPoints = inputPoints
        this.scaled = false
        this.resampled = false
        this.translated = false
        this.rotated = false
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
        this.angle = this.computeIndicativeAngle()
        GestureUtils.rotate(this.points, -this.angle)

        this.rotated = true
    }

    scale() {
        const points = this.points

        // 计算AABB/OBB
        const aabb = GestureUtils.computeAABB(points)
        const width = aabb[2]
        const height = aabb[3]

        let scaleX: number
        let scaleY: number
        if (this.keepAspectRatio) {
            if (width > height) {
                scaleX = this.scaledSize / width
                scaleY = scaleX
            } else {
                scaleY = this.scaledSize / height
                scaleX = scaleY
            }
        } else {
            scaleX = this.scaledSize / width
            scaleY = this.scaledSize / height
        }


        // 缩放AABB/OBB
        GestureUtils.scale(points, scaleX, scaleY)

        this.scaled = true
    }


    rotateOBB() {
        const points = this.points
        const obb = this.obb = this.obb || GestureUtils.computeOBB(points)
        // 旋转
        const angle = obb[0]
        this.angle = this.fixAngle(angle)
        GestureUtils.rotate(points, -this.angle)

        this.rotated = true
    }

    scaleOBB() {
        const points = this.points
        const obb = this.obb = this.obb || GestureUtils.computeOBB(points)
        const angle = obb[0]
        const width = obb[3]
        const height = obb[4]
        GestureUtils.rotate(points, -angle)

        let scaleX: number
        let scaleY: number
        if (this.keepAspectRatio) {
            if (width > height) {
                scaleX = this.scaledSize / width
                scaleY = scaleX
            } else {
                scaleY = this.scaledSize / height
                scaleX = scaleY
            }
        } else {
            scaleX = this.scaledSize / width
            scaleY = this.scaledSize / height
        }

        GestureUtils.scale(points, scaleX, scaleY)
        GestureUtils.rotate(points, -angle)
    }

    resample() {
        const inputPoints = this.points || this.inputPoints
        this.points = GestureUtils.resample(inputPoints, this.sampleCount)
        this.resampled = true
    }

    computeIndicativeAngle(centroid?: Point) {
        centroid = centroid || [0, 0]
        const first = this.points[0]
        let angle = Math.atan2(first[1] - centroid[0], first[0] - centroid[1])
        angle = this.fixAngle(angle)
        return this.fixAngle(angle)
    }

    fixAngle(angle: number) {
        if (this.orientationCount <= 1) {
            return angle
        }
        if (angle < 0) {
            angle = TWO_PI + angle
        }
        const sector = TWO_PI / this.orientationCount

        // console.log(sector * 180 / Math.PI, angle * 180 / Math.PI)
        const baseOrientation = Math.round(angle / sector) * sector
        angle = angle - baseOrientation
        // console.log(baseOrientation * 180 / Math.PI, angle * 180 / Math.PI)
        return angle
    }

    vectorize() {
        if (!this.points) {
            return
        }

        this.vector = GestureUtils.vectorize(this.points, this.sampleCount)

        this.vectorized = true
    }
}


