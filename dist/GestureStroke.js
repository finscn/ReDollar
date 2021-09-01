"use strict";
// export interface Point {
//     x: number,
//     y: number
// }
Object.defineProperty(exports, "__esModule", { value: true });
const GestureUtils_1 = require("./GestureUtils");
const TWO_PI = Math.PI * 2;
class GestureStroke {
    constructor() {
        this.sampleCount = 16;
        this.orientationCount = 1;
        this.scaledSize = 200;
        this.keepAspectRatio = false;
        this.id = null;
    }
    init(inputPoints) {
        this.inputPoints = inputPoints;
        this.scaled = false;
        this.resampled = false;
        this.translated = false;
        this.rotated = false;
    }
    translate() {
        let inputPoints;
        let outputPoints;
        if (!this.points) {
            inputPoints = this.inputPoints;
            outputPoints = this.points = [];
        }
        else {
            inputPoints = this.points;
        }
        // 求质心
        this.centroid = GestureUtils_1.default.computeCentroid(inputPoints);
        // 移到原点
        GestureUtils_1.default.translate(inputPoints, -this.centroid[0], -this.centroid[1], outputPoints);
        this.translated = true;
    }
    rotate() {
        // 旋转
        this.angle = this.computeIndicativeAngle();
        GestureUtils_1.default.rotate(this.points, -this.angle);
        this.rotated = true;
    }
    scale() {
        const points = this.points;
        // 计算AABB/OBB
        const aabb = GestureUtils_1.default.computeAABB(points);
        const width = aabb[2];
        const height = aabb[3];
        let scaleX;
        let scaleY;
        if (this.keepAspectRatio) {
            if (width > height) {
                scaleX = this.scaledSize / width;
                scaleY = scaleX;
            }
            else {
                scaleY = this.scaledSize / height;
                scaleX = scaleY;
            }
        }
        else {
            scaleX = this.scaledSize / width;
            scaleY = this.scaledSize / height;
        }
        // 缩放AABB/OBB
        GestureUtils_1.default.scale(points, scaleX, scaleY);
        this.scaled = true;
    }
    rotateOBB() {
        const points = this.points;
        const obb = this.obb = this.obb || GestureUtils_1.default.computeOBB(points);
        // 旋转
        const angle = obb[0];
        this.angle = this.fixAngle(angle);
        GestureUtils_1.default.rotate(points, -this.angle);
        this.rotated = true;
    }
    scaleOBB() {
        const points = this.points;
        const obb = this.obb = this.obb || GestureUtils_1.default.computeOBB(points);
        const angle = obb[0];
        const width = obb[3];
        const height = obb[4];
        GestureUtils_1.default.rotate(points, -angle);
        const scaleX = this.scaledSize / width;
        const scaleY = this.scaledSize / height;
        GestureUtils_1.default.scale(points, scaleX, scaleY);
        GestureUtils_1.default.rotate(points, -angle);
    }
    resample() {
        const inputPoints = this.points || this.inputPoints;
        this.points = GestureUtils_1.default.resample(inputPoints, this.sampleCount);
        this.resampled = true;
    }
    computeIndicativeAngle(centroid) {
        centroid = centroid || [0, 0];
        const first = this.points[0];
        let angle = Math.atan2(first[1] - centroid[0], first[0] - centroid[1]);
        angle = this.fixAngle(angle);
        return this.fixAngle(angle);
    }
    fixAngle(angle) {
        if (this.orientationCount <= 1) {
            return angle;
        }
        if (angle < 0) {
            angle = TWO_PI + angle;
        }
        const sector = TWO_PI / this.orientationCount;
        // console.log(sector * 180 / Math.PI, angle * 180 / Math.PI)
        const baseOrientation = Math.round(angle / sector) * sector;
        angle = angle - baseOrientation;
        // console.log(baseOrientation * 180 / Math.PI, angle * 180 / Math.PI)
        return angle;
    }
    vectorize() {
        if (!this.points) {
            return;
        }
        this.vector = GestureUtils_1.default.vectorize(this.points, this.sampleCount);
        this.vectorized = true;
    }
}
exports.default = GestureStroke;
