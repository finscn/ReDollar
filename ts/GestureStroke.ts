
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
    scaleSize = 200

    // useAngleInvariance
    // useBoundedRotationInvariance

    id: string = null

    points: Point[]
    inputPoints: Point[]
    centroid: Point
    angle: number
    length: number

    vector: number[]
    aabb: number[]

    init(inputPoints: Point[]) {
        this.length = this.computeLength(inputPoints)
        this.centroid = this.computeCentroid(inputPoints)
        this.inputPoints = inputPoints
    }

    transform() {
        this.resample()
        this.translate()
        this.rotate()
        this.scale()
    }

    translate() {
        // 移到原点
        GestureUtils.translate(this.points, -this.centroid[0], -this.centroid[1])
    }

    rotate() {
        // 旋转
        this.angle = this.computeAngle()
        GestureUtils.rotate(this.points, -this.angle)
    }

    scale() {
        if (!this.ratioSensitive) {
            // 计算AABB/OBB
            this.aabb = GestureUtils.computeAABB(this.points)
            const width = this.aabb[2]
            const height = this.aabb[3]

            // 缩放AABB/OBB
            const scaleX = this.scaleSize / width
            const scaleY = this.scaleSize / height

            GestureUtils.scale(this.points, scaleX, scaleY)
        }
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

    computeCentroid(inputPoints: Point[]): Point {
        let x = 0
        let y = 0
        const count = inputPoints.length
        for (let i = 0; i < count; i++) {
            x += inputPoints[i][0]
            y += inputPoints[i][1]
        }
        x /= count
        y /= count
        return [x, y]
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

    resample() {
        const inputPoints = this.inputPoints
        const sampleCount = this.pointCount

        const points: Point[] = this.points = this.points || []
        points.length = 0

        const count = inputPoints.length
        const length = this.length

        const increment = length / (sampleCount - 1)

        let distanceSoFar = 0
        let lastX = inputPoints[0][0]
        let lastY = inputPoints[0][1]

        let currentX: number = -Infinity
        let currentY: number = -Infinity

        let index = 0
        points[index] = [lastX, lastY]

        let i = 0
        while (i < count) {
            if (currentX === -Infinity) {
                i++
                if (i >= count) {
                    break
                }
                currentX = inputPoints[i][0]
                currentY = inputPoints[i][1]
            }
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
                points[index] = [nx, ny]
                index++
            } else {
                lastX = currentX
                lastY = currentY
                currentX = -Infinity
                currentY = -Infinity
                distanceSoFar += distance
            }
        }

        for (i = index; i < sampleCount; i++) {
            points[i] = [lastX, lastY]
        }
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


