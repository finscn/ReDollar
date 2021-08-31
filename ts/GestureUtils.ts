import { Point } from "./GestureStroke"

export enum Similarity {
    Euclidean,
    Cos,
    OptimalCos
}

export default class GestureUtils {

    private constructor() {

    }

    static rotateAround(points: Point[], angle: number, center: Point) {
        const count = points.length
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        for (let i = 0; i < count; i++) {
            const p = points[i]
            const x = (p[0] - center[0]) * cos - (p[1] - center[1]) * sin
            const y = (p[0] - center[0]) * sin + (p[1] - center[1]) * cos
            p[0] = x + center[0]
            p[1] = y + center[1]
        }
    }


    static translate(points: Point[], dx: number, dy: number, outputPoints?: Point[]) {
        const count = points.length

        if (outputPoints) {
            for (let i = 0; i < count; i++) {
                const p = points[i]
                outputPoints.push([p[0] + dx, p[1] + dy])
            }
            return
        }

        for (let i = 0; i < count; i++) {
            const p = points[i]
            p[0] += dx
            p[1] += dy
        }
    }

    static rotate(points: Point[], angle: number) {
        const count = points.length
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        for (let i = 0; i < count; i++) {
            const p = points[i]
            const x = p[0] * cos - p[1] * sin
            const y = p[0] * sin + p[1] * cos
            p[0] = x
            p[1] = y
        }
    }

    static scale(points: Point[], sx: number, sy: number) {
        const count = points.length
        for (let i = 0; i < count; i++) {
            const p = points[i]
            p[0] *= sx
            p[1] *= sy
        }
    }

    static computeLength(points: Point[]): number {
        let d = 0
        let p0: Point = points[0]
        let p1: Point
        const count = points.length
        for (let i = 1; i < count; i++) {
            p1 = points[i]
            const dx = p1[0] - p0[0]
            const dy = p1[1] - p0[1]
            d += Math.sqrt(dx * dx + dy * dy)
            p0 = p1
        }
        return d
    }

    static resample(inputPoints: Point[], sampleCount: number): Point[] {
        const count = inputPoints.length
        const length = GestureUtils.computeLength(inputPoints)
        const increment = length / (sampleCount - 1)

        let lastX = inputPoints[0][0]
        let lastY = inputPoints[0][1]
        let distanceSoFar = 0

        const outputPoints: Point[] = [
            [lastX, lastY]
        ]

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

        return outputPoints
    }

    static euclideanDistanceSquared(vector1: number[], vector2: number[]): number {
        let squaredDistance = 0
        const size = vector1.length
        for (let i = 0; i < size; i++) {
            const difference = vector1[i] - vector2[i]
            squaredDistance += difference * difference
        }
        return squaredDistance / size
    }

    static cosineDistance(vector1: number[], vector2: number[]): number {
        let sum = 0
        const len = vector1.length
        for (let i = 0; i < len; i++) {
            sum += vector1[i] * vector2[i]
        }
        return Math.acos(sum)
    }

    static minimumCosineDistance(vector1: number[], vector2: number[], numOrientations?: number): number {
        const len = vector1.length
        let a = 0
        let b = 0
        for (let i = 0; i < len; i += 2) {
            a += vector1[i] * vector2[i] + vector1[i + 1] * vector2[i + 1]
            b += vector1[i] * vector2[i + 1] - vector1[i + 1] * vector2[i]
        }
        if (a === 0) {
            return Math.PI / 2
        }

        const tan = b / a
        const angle = Math.atan(tan)
        if (numOrientations > 2 && Math.abs(angle) >= Math.PI / numOrientations) {
            return Math.acos(a)
        }
        const cosine = Math.cos(angle)
        const sine = cosine * tan

        return Math.acos(a * cosine + b * sine)
    }

    private static computeCoVariance(points: Point[]): number[][] {
        const array: number[][] = [
            [0, 0],
            [0, 0]
        ]

        const count = points.length
        for (let i = 0; i < count; i += 1) {
            const x = points[i][0]
            const y = points[i][1]
            array[0][0] += x * x
            array[0][1] += x * y
            array[1][0] = array[0][1]
            array[1][1] += y * y
        }
        array[0][0] /= count
        array[0][1] /= count
        array[1][0] /= count
        array[1][1] /= count
        return array
    }

    private static computeOrientation(covarianceMatrix: number[][]): number[] {
        const targetVector: number[] = []
        if (covarianceMatrix[0][1] === 0 || covarianceMatrix[1][0] === 0) {
            targetVector[0] = 1
            targetVector[1] = 0
        }
        const a: number = -covarianceMatrix[0][0] - covarianceMatrix[1][1]
        const b: number = covarianceMatrix[0][0] * covarianceMatrix[1][1]
            - covarianceMatrix[0][1] * covarianceMatrix[1][0]
        const value: number = a / 2
        const rightside: number = Math.sqrt(Math.pow(value, 2) - b)
        const lambda1: number = -value + rightside
        const lambda2: number = -value - rightside
        if (lambda1 === lambda2) {
            targetVector[0] = 0
            targetVector[1] = 0
        } else {
            const lambda: number = lambda1 > lambda2 ? lambda1 : lambda2
            targetVector[0] = 1
            targetVector[1] = (lambda - covarianceMatrix[0][0]) / covarianceMatrix[0][1]
        }
        return targetVector
    }

    static computeOBB(points: Point[]): number[] {
        const array: number[][] = this.computeCoVariance(points)
        const targetVector: number[] = this.computeOrientation(array)
        let angle: number
        if (targetVector[0] === 0 && targetVector[1] === 0) {
            angle = - Math.PI / 2
        } else { // -PI < alpha < PI
            angle = Math.atan2(targetVector[1], targetVector[0])
        }

        this.rotate(points, -angle)

        let minX: number = Number.MAX_VALUE
        let minY: number = Number.MAX_VALUE
        let maxX: number = Number.MIN_VALUE
        let maxY: number = Number.MIN_VALUE
        const count = points.length
        for (let i = 0; i < count; i++) {
            const p = points[i]
            if (p[0] < minX) {
                minX = p[0]
            }
            if (p[0] > maxX) {
                maxX = p[0]
            }
            if (p[1] < minY) {
                minY = p[1]
            }
            if (p[1] > maxY) {
                maxY = p[1]
            }
        }

        return [
            angle,
            maxX - minX,
            maxY - minY
        ]
    }

    static computeCentroid(points: Point[]): Point {
        let x = 0
        let y = 0
        const count = points.length
        for (let i = 0; i < count; i++) {
            x += points[i][0]
            y += points[i][1]
        }
        x /= count
        y /= count
        return [x, y]
    }

    static computeAABB(points: Point[]): number[] {
        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        for (let i = 0, len = points.length; i < len; i++) {
            const p = points[i]
            minX = Math.min(minX, p[0])
            maxX = Math.max(maxX, p[0])
            minY = Math.min(minY, p[1])
            maxY = Math.max(maxY, p[1])
        }
        return [
            minX,
            minY,
            maxX - minX,
            maxY - minY
        ]
    }

    static computeIndicativeAngle(originalPoint: number[], rotationInvariance: number) {
        let angle: number
        if (originalPoint[0] === 0 && originalPoint[1] === 0) {
            angle = - Math.PI / 2
        } else {
            angle = Math.atan2(originalPoint[1], originalPoint[0])
        }
        if (rotationInvariance) {
            const r = rotationInvariance
            const baseOrientation = r * Math.floor((angle + r / 2) / r)
            return angle - baseOrientation
        }
        return angle
    }

    static computeScale(aabb: number[], width: number, height: number, ratio1D: number = 0.3) {
        // keepAspectRatio
        height = height || width
        if (ratio1D) {
            const longSide = Math.max(aabb[2], aabb[3])
            const shortSide = Math.min(aabb[2], aabb[3])
            const uniformly = shortSide / longSide < ratio1D
            if (uniformly) {
                const scaleX = width / longSide
                const scaleY = height / longSide
                return [scaleX, scaleY]
            }
        }
        const scaleX = width / aabb[2]
        const scaleY = height / aabb[3]
        return [scaleX, scaleY]
    }

}
