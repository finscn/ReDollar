
// export interface Point {
//     x: number,
//     y: number
// }

import GestureUtils from "./GestureUtils"

export type Point = [number, number]

export default class GestureStroke {

    pointCount = 16

    // rotateOBB = false // rotateOBB or rotateIndicativeAngle
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
    aabb: number[]

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
        this.scale()
        this.resample()
        this.translate()
        this.rotate()
    }

    scale(afterResample = false) {
        if (this.ratioSensitive) {
            return
        }

        const points = afterResample ? this.points : this.inputPoints

        // 计算AABB/OBB
        this.aabb = GestureUtils.computeAABB(points)
        const width = this.aabb[2]
        const height = this.aabb[3]

        // 缩放AABB/OBB
        const scaleX = this.scaledSize / width
        const scaleY = this.scaledSize / height

        GestureUtils.scale(points, scaleX, scaleY)

        this.scaled = true
    }

    resample() {
        const inputPoints = this.inputPoints
        const sampleCount = this.pointCount

        const outputPoints: Point[] = this.points = this.points || []
        outputPoints.length = 0

        const length = this.computeLength(inputPoints)
        const count = inputPoints.length
        const increment = length / (sampleCount - 1)

        let lastX = inputPoints[0][0]
        let lastY = inputPoints[0][1]
        let distanceSoFar = 0

        outputPoints.push([lastX, lastY])

        for (let i = 1; i < count;) {
            const currentX = inputPoints[i][0]
            const currentY = inputPoints[i][1]
            const deltaX = currentX - lastX
            const deltaY = currentY - lastY

            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            if (distanceSoFar + distance >= increment) {
                const ratio = (increment - distanceSoFar) / distance
                const nx = lastX + ratio * deltaX
                const ny = lastY + ratio * deltaY
                lastX = nx
                lastY = ny
                distanceSoFar = 0
                outputPoints.push([nx, ny])
            } else {
                lastX = currentX
                lastY = currentY
                distanceSoFar += distance
                i++
            }
        }

        for (let i = outputPoints.length; i < sampleCount; i++) {
            outputPoints.push([lastX, lastY])
        }

        this.resampled = true
    }

    translate() {
        // 移到原点
        this.centroid = this.computeCentroid()
        GestureUtils.translate(this.points, -this.centroid[0], -this.centroid[1])

        this.translated = true
    }

    rotate() {
        // 旋转
        this.angle = this.computeAngle()
        GestureUtils.rotate(this.points, -this.angle)

        this.rotated = true
    }

    computeLength(inputPoints: Point[]): number {
        let d = 0
        let p0: Point = inputPoints[0]
        let p1: Point
        const count = inputPoints.length
        for (let i = 1; i < count; i++) {
            p1 = inputPoints[i]
            const dx = p1[0] - p0[0]
            const dy = p1[1] - p0[1]
            d += Math.sqrt(dx * dx + dy * dy)
            p0 = p1
        }
        return d
    }

    computeCentroid(): Point {
        return GestureUtils.computeCentroid(this.points)
    }

    computeAngle(centroid?: Point) {
        centroid = centroid || [0, 0]
        const first = this.points[0]
        let angle = Math.atan2(first[1] - centroid[0], first[0] - centroid[1])
        if (this.orientationCount > 1) {
            const TWO_PI = Math.PI * 2
            if (angle < 0) {
                angle = TWO_PI + angle
            }
            const sector = TWO_PI / this.orientationCount

            console.log(sector * 180 / Math.PI, angle * 180 / Math.PI)
            const baseOrientation = Math.round(angle / sector) * sector
            // const baseOrientation = r * Math.floor((angle + r / 2) / r)
            angle = angle - baseOrientation
            console.log(baseOrientation * 180 / Math.PI, angle * 180 / Math.PI)
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
        let count = this.pointCount
        for (let i = 0; i < count; i++) {
            const p = this.points[i]
            const x = p[0]
            const y = p[1]
            vector.push(x)
            vector.push(y)
            sum += x * x + y * y
        }
        const magnitude = Math.sqrt(sum)
        count <<= 1
        for (let i = 0; i < count; i++) {
            vector[i] /= magnitude
        }
    }
}


