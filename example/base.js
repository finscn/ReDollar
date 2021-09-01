let capture = false

function $id(id) {
    return document.getElementById(id);
}

function $name(name) {
    return document.getElementsByName(name);
}

function initTouchEvent(dom) {
    dom = dom || document;

    var useTouch = "ontouchstart" in window;
    var start = "mousedown",
        move = "mousemove",
        end = "mouseup";
    if (useTouch) {
        start = "touchstart";
        move = "touchmove";
        end = "touchend";
    }

    dom.addEventListener(start, function (event) {
        var touch = useTouch ? event.changedTouches[0] : event;
        reset();
        TouchInfo.touched = true;
        TouchInfo.lastX = -1000;
        TouchInfo.lastY = -1000;
        TouchInfo.x = touch.pageX;
        TouchInfo.y = touch.pageY;
        event.preventDefault();
    }, true);

    dom.addEventListener(move, function (event) {
        var touch = useTouch ? event.changedTouches[0] : event;

        if (TouchInfo.touched) {
            TouchInfo.x = touch.pageX;
            TouchInfo.y = touch.pageY;
        }
        event.preventDefault();
    }, true);

    dom.addEventListener(end, function (event) {
        TouchInfo.touched = false;
        game.scene.afterDraw();
        event.preventDefault();
    }, true);

}

function drawPoly(context, vertices, color, tx, ty) {
    tx = tx || 0;
    ty = ty || 0;
    if (color) {
        context.strokeStyle = color;
    }
    var vertexCount = vertices.length;
    var a = vertices[0];
    var first = a;
    context.beginPath();
    context.moveTo(a[0] + tx, a[1] + ty);
    for (var j = 1; j < vertexCount; j++) {
        var a = vertices[j];
        context.lineTo(a[0] + tx, a[1] + ty);
    }
    // context.lineTo(first[0], first[1]);
    context.stroke()
    context.closePath();
}

function drawLine(context, p1, p2, color, tx, ty) {
    tx = tx || 0;
    ty = ty || 0;
    if (color) {
        context.strokeStyle = color;
    }
    context.beginPath();
    context.moveTo(p1[0] + tx, p1[1] + ty);
    context.lineTo(p2[0] + tx, p2[1] + ty);
    context.stroke()
    context.closePath();
}

function drawVector(context, vector, color, tx, ty) {
    tx = tx || 0;
    ty = ty || 0;
    if (color) {
        context.strokeStyle = color;
    }
    context.beginPath();
    context.moveTo(vector[0] + tx, vector[1] + ty);
    for (var j = 1; j < vector.length; j += 2) {
        var x = vector[j];
        var y = vector[j + 1];
        context.lineTo(x + tx, y + ty);
    }
    // context.lineTo(first[0], first[1]);
    context.stroke()
    context.closePath();
}

function createGestureImg(points, size) {
    size = size || 80;
    var aabb = GestureUtils.computeAABB(points);
    var os = Math.max(aabb[2], aabb[3]);
    var scale = Math.min(1, size / os) * 0.7;
    var tx = size / 2,
        ty = size / 2;

    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.retinaResolutionEnabled = false;
    var context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.strokeStyle = "#000000";
    context.strokeRect(0, 0, size, size);
    context.lineWidth = 10;
    context.save();
    context.translate(tx, ty);
    context.scale(scale, scale);
    drawPoly(context, points, "#3366ff");
    context.restore();
    return canvas;
}

function initGame() {
    game = new Game({
        width: Config.width,
        height: Config.height,
        onInit: function () {
            initTouchEvent(this.canvas)

            originalPoint[0] = this.width / 2
            originalPoint[1] = this.height / 2

            this.start();
        },
        beforeStart: function () {
            this.context.font = "20px Arial";
            this.scene = {
                width: this.width,
                height: this.height,
                game: this,
                cooldown: 0,
                afterDraw: function () {
                    if (Points.length > 2) {
                        CurrentGesture = gestureTool.createGesture(Points);
                    }
                },
                update: function (timeStep, now) {
                    if (TouchInfo.touched && this.cooldown <= 0) {
                        var dx = TouchInfo.x - TouchInfo.lastX;
                        var dy = TouchInfo.y - TouchInfo.lastY;
                        if (Math.abs(dx) + Math.abs(dy) > 10) {
                            Points.push([TouchInfo.x, TouchInfo.y]);
                            TouchInfo.lastX = TouchInfo.x;
                            TouchInfo.lastY = TouchInfo.y;
                        }
                        this.cooldown = 0;
                    }
                    this.cooldown--;
                },
                render: function (context, timeStep, now) {

                    context.fillStyle = Config.bgColor;
                    context.fillRect(0, 0, this.width, this.height);

                    context.lineWidth = 3;
                    context.strokeStyle = "#999999";
                    context.strokeRect(0, 0, this.width, this.height);
                    context.lineWidth = 1;

                    var tx = originalPoint[0];
                    var ty = originalPoint[1];

                    if (!capture && Config.drawCoordinate) {
                        var l = 400;
                        drawLine(context, [-l, 0], [l, 0], "#bbbbbb", tx, ty);
                        drawLine(context, [0, -l], [0, l], "#bbbbbb", tx, ty);
                        if (gestureTool.orientationCount > 4) {
                            drawLine(context, [-l, -l], [l, l], "#bbbbbb", tx, ty);
                            drawLine(context, [l, -l], [-l, l], "#bbbbbb", tx, ty);
                        }
                        context.fillStyle = "#990000";
                        context.fillRect(tx - 3, ty - 3, 6, 6);

                        // const scaleSize = gestureTool.scaleSize;
                        // context.strokeRect(tx - scaleSize / 2, ty - scaleSize/2, scaleSize, scaleSize);
                    }


                    // var names = Object.keys(RecordPoints)
                    // if (names.length == 1) {
                    //     var points = RecordPoints[names[0]]
                    //     context.lineWidth = 2;
                    //     drawPoly(context, points, "#bb9999", tx, ty);
                    // }

                    if (!capture && MatchGesture) {
                        var points = RecordPoints[MatchGesture]
                        context.lineWidth = 2;
                        drawPoly(context, points, "#bb9999", tx, ty);
                    }

                    if (CurrentGesture && CurrentGesture.translated) {
                        context.save();
                        context.translate(originalPoint[0], originalPoint[1]);
                    }

                    if (Points && Points.length > 0) {
                        context.globalAlpha = 0.6;
                        context.lineWidth = 4;
                        drawPoly(context, Points, "blue", 0, 0);
                        context.fillStyle = "red";
                        Points.forEach(function (p) {
                            context.fillRect(p[0] - 4, p[1] - 4, 8, 8);
                        });

                        if (!capture && Centroid) {
                            context.fillStyle = "darkgreen";
                            context.fillRect(Centroid[0] - 5, Centroid[1] - 5, 10, 10);
                            drawLine(context, Points[0], Centroid, "#6699ff");
                        }
                    }

                    if (!capture && Config.drawOBB && obbRect) {
                        context.lineWidth = 3;
                        drawPoly(context, obbRect, "#00bb00", 0, 0);
                    }

                    context.globalAlpha = 1;
                    if (CurrentGesture && CurrentGesture.translated) {
                        context.restore();
                    }


                    var x = 4,
                        y = 4;
                    var size = 80,
                        t = 4;
                    context.lineWidth = t;
                    context.strokeStyle = "red";
                    for (var name in GestureImgs) {
                        var img = GestureImgs[name];
                        context.drawImage(img, x, y);
                        if (MatchGesture == name) {
                            context.strokeRect(x + t / 2, y + t / 2, size - t, size - t);
                            context.fillText(recognizeTime + "ms", x + t / 2, 100);
                        }
                        x += size + 10;
                    }
                    if (MatchGesture === false) {
                        context.fillText("No Match", 10, 100);
                    }

                    // }
                }
            }
        }
    });

    game.init();

}

function init() {
    for (var p in Config.default) {
        gestureTool[p] = Config.default[p]
    }

    loadGestures();
    initGame();
    $id('toolbar').style.left = ($id('canvas').clientLeft + $id('canvas').clientWidth + 4) + 'px'
    $id('toolbar').style.top = 4 + 'px'
}

function reset() {
    step = 0;
    deltaX = 0;
    deltaY = 0;

    Points = [];
    obbRect = null;
    obbRectAngle = 0;
    CurrentGesture = null;
    Centroid = null;
    MatchGesture = null;
    recognizeTime = 0;
}

function saveData(name, value) {
    window.localStorage.setItem(Config.storePrefix + '_' + name, value)
}

function loadData(name) {
    return window.localStorage.getItem(Config.storePrefix + '_' + name)
}

function loadGestures() {

    setSampleCount()
    setThreshold()
    setOrientationCount()
    setKeepAspectRatio()
    setRotateOBB()
    setScaleOBB()

    const rec = loadData('RecordPoints')
    if (rec) {
        RecordPoints = JSON.parse(rec) || {}
    }

    gestureTool.loadGestures()
    var names = gestureTool.getAllGestureNames();
    var count = names.length
    names.forEach((name) => {
        var points = RecordPoints[name]
        var img = createGestureImg(points);
        GestureImgs[name] = img;
    })

    $id("gcount") && ($id("gcount").innerHTML = count)
}

function clearAllGestures() {
    gestureTool.removeAllGestures();
    gestureTool.saveGestures();

    RecordPoints = {}
    saveData('RecordPoints', JSON.stringify(RecordPoints))

    doReload()
}

function addGesture() {
    if (!CurrentGesture) {
        return;
    }

    transform()

    var name = null; // prompt("手势名称", "");
    if (!name) {
        name = 'N_' + Object.keys(RecordPoints).length
    }

    this.gestureTool.addGesture(name, CurrentGesture)
    this.gestureTool.saveGestures();

    RecordPoints[name] = CurrentGesture.points
    saveData('RecordPoints', JSON.stringify(RecordPoints))

    var names = gestureTool.getAllGestureNames();
    var count = names.length
    $id("gcount").innerHTML = count;

    doReload()
}


function testGesture(transform) {
    if (!CurrentGesture) {
        return
    }
    if (transform) {
        transform()
        step = 4
        Points = CurrentGesture.points
        Centroid = [0, 0]
    }
    CurrentGesture.vectorize()
    var t, result

    t = Date.now();
    result = gestureTool.recognize(CurrentGesture.vector);
    recognizeTime = Date.now() - t;
    console.log(result, recognizeTime)

    if (result && result.success) {
        MatchGesture = result.gesture
    }

    if (!MatchGesture) {
        MatchGesture = false;
    }
}


function doReload() {
    window.location.reload();
}


///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////


function setSampleCount(target) {
    if (!target) {
        const sampleCount = loadData('sampleCount')
        gestureTool.sampleCount = Number(sampleCount) || 32
        $id('sampleCount') && ($id('sampleCount').value = gestureTool.sampleCount)
        return
    }
    console.log(target.id, target.value)
    gestureTool.sampleCount = Number(target.value) || 32
    saveData('sampleCount', gestureTool.sampleCount)
}


function setThreshold(target) {
    if (!target) {
        const threshold = loadData('threshold')
        gestureTool.threshold = Number(threshold) || 0.25
        $id('threshold') && ($id('threshold').value = gestureTool.threshold)
        return
    }
    console.log(target.id, target.value)
    gestureTool.threshold = Number(target.value)
    saveData('threshold', gestureTool.threshold)
}


function setOrientationCount(target) {
    if (!target) {
        const orientationCount = loadData('orientationCount')
        gestureTool.orientationCount = Number(orientationCount) || 1
        $id('toggleOrientation') && ($id('toggleOrientation').value = gestureTool.orientationCount)
        return
    }
    console.log(target.id, target.value)
    gestureTool.orientationCount = Number(target.value) || 1
    saveData('orientationCount', gestureTool.orientationCount)
}


function setKeepAspectRatio(target) {
    if (!target) {
        const keepAspectRatio = loadData('keepAspectRatio')
        gestureTool.keepAspectRatio = keepAspectRatio === 'true' ? true : false
        $id('setKeepAspectRatio') && ($id('setKeepAspectRatio').checked = gestureTool.keepAspectRatio)

        // $id('doScale').disabled = gestureTool.keepAspectRatio
        return
    }
    console.log(target.id, target.checked)
    gestureTool.keepAspectRatio = !!target.checked
    saveData('keepAspectRatio', gestureTool.keepAspectRatio)

    // $id('doScale').disabled = gestureTool.keepAspectRatio
}


function setRotateOBB(target) {
    if (!target) {
        const rotateOBB = loadData('rotateOBB')
        Config.rotateOBB = rotateOBB === 'true' ? true : false
        $id('setRotateOBB') && ($id('setRotateOBB').checked = Config.rotateOBB)
        return
    }
    console.log(target.id, target.checked)
    Config.rotateOBB = !!target.checked
    saveData('rotateOBB', Config.rotateOBB)
}


function setScaleOBB(target) {
    if (!target) {
        const scaleOBB = loadData('scaleOBB')
        Config.scaleOBB = scaleOBB === 'true' ? true : false
        $id('setScaleOBB') && ($id('setScaleOBB').checked = Config.scaleOBB)
        return
    }
    console.log(target.id, target.checked)
    Config.scaleOBB = !!target.checked
    saveData('scaleOBB', Config.scaleOBB)
}


///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////


function doTranslate() {
    if (!CurrentGesture || CurrentGesture.translated) {
        return
    }
    Centroid = [0, 0]

    CurrentGesture.translate()

    Points = []
    CurrentGesture.points.forEach(function (p) {
        Points.push([p[0], p[1]])
    })

    obbRect = getOBBRect(GestureUtils.computeOBB(Points))
}

function doRotate() {
    if (!CurrentGesture || CurrentGesture.rotated) {
        return
    }

    var c1 = GestureUtils.computeCentroid(CurrentGesture.points)

    if (Config.rotateOBB) {
        CurrentGesture.rotateOBB()
    } else {
        CurrentGesture.rotate()
    }

    var c0 = GestureUtils.computeCentroid(Points)

    var dx = c1[0] - c0[0]
    var dy = c1[1] - c0[1]

    Centroid = [0, 0]

    Points = []
    CurrentGesture.points.forEach(function (p) {
        Points.push([p[0] - dx, p[1] - dy])
    })
    if (obbRect) {
        GestureUtils.rotate(obbRect, -CurrentGesture.angle)
    }
}

function doScale() {
    if (!CurrentGesture || CurrentGesture.scaled) {
        return
    }

    var c0 = GestureUtils.computeCentroid(Points)

    if (Config.scaleOBB) {
        CurrentGesture.scaleOBB()
    } else {
        CurrentGesture.scale()
    }

    var c1 = GestureUtils.computeCentroid(CurrentGesture.points)
    deltaX = c1[0] - c0[0]
    deltaY = c1[1] - c0[1]
    // if (CurrentGesture.resampled) {
    //     deltaX = 0
    //     deltaY = 0
    // }

    Points = []
    CurrentGesture.points.forEach(function (p) {
        Points.push([p[0] - deltaX, p[1] - deltaY])
    })

    if (Config.scaleOBB) {
        obbRect = getOBBRect(GestureUtils.computeOBB(Points))
    } else {
        obbRect = getAABBRect(GestureUtils.computeAABB(Points))
    }

}

function doResample(afterScale) {
    if (!CurrentGesture || CurrentGesture.resampled) {
        return
    }

    CurrentGesture.resample()

    var dx = 0
    var dy = 0
    if (afterScale) {
        dx = deltaX
        dy = deltaY
    }

    Points = []
    CurrentGesture.points.forEach(function (p) {
        Points.push([p[0] - dx, p[1] - dy])
    })
}

///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////


Config.width = 800;
Config.height = 600;
Config.bgColor = "#ffffff"
Config.drawCoordinate = true;
Config.storePrefix = "pp";

Config.rotateOBB = false;
Config.scaleOBB = false;
Config.drawOBB = true;

Config.default = {
    similarity: Similarity.OptimalCos,
    threshold: 0.25,

    sampleCount: 32,
    orientationCount: 1,
    scaleSize: 200,
    keepAspectRatio: false,
}

var GestureImgs = {};
var originalPoint = [0, 0]


var game;

var gestureTool = new GestureTool()

var Points = [];
var RecordPoints = {};
var obbRect = null;
var obbRectAngle = 0;

var CurrentGesture;
var Centroid;
var MatchGesture = null;
var TouchInfo = {
    touched: false,
    x: 0,
    y: 0,
};
var recognizeTime = 0;

var step = 0;
var deltaX = 0;
var deltaY = 0;


function getOBBRect(obb) {
    const angle = obb[0]
    obbRectAngle = angle
    const x1 = obb[1]
    const y1 = obb[2]
    const x2 = obb[1] + obb[3]
    const y2 = obb[2] + obb[4]
    const rect = [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
        [x1, y1]
    ]
    GestureUtils.rotate(rect, angle)
    return rect
}

function getAABBRect(aabb) {
    const x1 = aabb[0]
    const y1 = aabb[1]
    const x2 = aabb[0] + aabb[2]
    const y2 = aabb[1] + aabb[3]
    const rect = [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
        [x1, y1]
    ]
    return rect
}

function transform() {
    CurrentGesture.translate()

    if (Config.rotateOBB) {
        CurrentGesture.rotateOBB()
    } else {
        CurrentGesture.rotate()
    }

    if (Config.scaleOBB) {
        CurrentGesture.scaleOBB()
    } else {
        CurrentGesture.scale()
    }

    CurrentGesture.resample()
}
