import { Point } from "./GestureStroke"

export enum Similarity  {
    Euclidean,
    Cos,
    OptimalCos
}

export default class GestureUtils {

    private constructor() {

    }

    static rotate(points: Point[], angle: number): Point[] {
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
        return points
    }

    static translate(points: Point[], dx: number, dy: number): Point[] {
        const count = points.length
        for (let i = 0; i < count; i++) {
            const p = points[i]
            p[0] += dx
            p[1] += dy
        }
        return points
    }

    static scale(points: Point[], sx: number, sy: number): Point[] {
        if (sx === 1 && sy === 1) {
            return points
        }
        const count = points.length
        for (let i = 0; i < count; i++) {
            const p = points[i]
            p[0] *= sx
            p[1] *= sy
        }
        return points
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
            this.rotate(points, -angle)
        }

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
