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

    dom.addEventListener(move, function () {
        var touch = useTouch ? event.changedTouches[0] : event;

        if (TouchInfo.touched) {
            TouchInfo.x = touch.pageX;
            TouchInfo.y = touch.pageY;
        }
        event.preventDefault();
    }, true);

    dom.addEventListener(end, function () {
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

                    if (Config.drawCoordinate) {
                        var l = 400;
                        drawLine(context, [-l, 0], [l, 0], "#bbbbbb", tx, ty);
                        drawLine(context, [0, -l], [0, l], "#bbbbbb", tx, ty);
                        if (gestureTool.orientationCount > 4) {
                            drawLine(context, [-l, -l], [l, l], "#bbbbbb", tx, ty);
                            drawLine(context, [l, -l], [-l, l], "#bbbbbb", tx, ty);
                        }
                        context.fillStyle = "#990000";
                        context.fillRect(tx - 3, ty - 3, 6, 6);
                    }


                    var names = Object.keys(RecordPoints)
                    if (names.length == 1) {
                        var points = RecordPoints[names[0]]
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

                        if (Centroid) {
                            context.fillStyle = "darkgreen";
                            context.fillRect(Centroid[0] - 5, Centroid[1] - 5, 10, 10);
                            drawLine(context, Points[0], Centroid, "#6699ff");
                        }
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

function reset() {
    step = 0;
    deltaX = 0;
    deltaY = 0;

    Points = [];
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
    const threshold = loadData('threshold')
    gestureTool.threshold = Number(threshold) || 0.25
    $id('threshold') && ($id('threshold').value = gestureTool.threshold)

    const orientationCount = loadData('orientationCount')
    gestureTool.orientationCount = Number(orientationCount) || 1
    $id('toggleOrientation') && ($id('toggleOrientation').value = gestureTool.orientationCount)

    const sampleCount = loadData('sampleCount')
    gestureTool.sampleCount = Number(sampleCount) || 32
    $id('sampleCount') && ($id('sampleCount').value = gestureTool.sampleCount)

    const ratioSensitive = loadData('ratioSensitive')
    gestureTool.ratioSensitive = ratioSensitive === 'true' ? true : false
    $id('toggleRatio') && ($id('toggleRatio').checked = gestureTool.ratioSensitive)
    $id('doScale') && ($id('doScale').disabled = gestureTool.ratioSensitive)

    const scaleOBB = loadData('scaleOBB')
    gestureTool.scaleOBB = scaleOBB === 'true' ? true : false
    $id('toggleScaleOBB') && ($id('toggleScaleOBB').checked = gestureTool.scaleOBB)

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

    Points = [];
    $id("gcount").innerHTML = 0;

    doReload()
}

function doReload() {
    window.location.reload();
}


///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////


function doSetThreshold(target) {
    console.log(target.id, target.value)
    gestureTool.threshold = Number(target.value)
    saveData('threshold', gestureTool.threshold)
}

function doSetRatio(target) {
    console.log(target.id, target.checked)
    gestureTool.ratioSensitive = !!target.checked
    saveData('ratioSensitive', gestureTool.ratioSensitive)

    $id('doScale').disabled = gestureTool.ratioSensitive
}

function doSetScaleOBB(target) {
    console.log(target.id, target.checked)
    gestureTool.scaleOBB = !!target.checked
    saveData('scaleOBB', gestureTool.scaleOBB)

    if (gestureTool.scaleOBB) {
        $id('doRotate').parentNode.insertBefore($id('doScale'), $id('doRotate'))
    } else {
        $id('doRotate').parentNode.insertBefore($id('doRotate'), $id('doScale'))
    }

}

function doSetOrientation(target) {
    console.log(target.id, target.value)
    gestureTool.orientationCount = Number(target.value) || 1
    saveData('orientationCount', gestureTool.orientationCount)
}

function doSetSampleCount(target) {
    console.log(target.id, target.value)
    gestureTool.sampleCount = Number(target.value) || 32
    saveData('sampleCount', gestureTool.sampleCount)
}

///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////


function doScale() {
    if (CurrentGesture) {

        var c0 = GestureUtils.computeCentroid(Points)
        CurrentGesture.scale()
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
    }
}

function doResample(afterScale) {
    if (CurrentGesture) {

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
}

function doTranslate() {
    if (CurrentGesture) {
        Centroid = [0, 0]

        CurrentGesture.translate()

        Points = []
        CurrentGesture.points.forEach(function (p) {
            Points.push([p[0], p[1]])
        })
    }
}

function doRotate() {
    if (CurrentGesture) {
        var c1 = GestureUtils.computeCentroid(CurrentGesture.points)
        if (!CurrentGesture.translated) {
            GestureUtils.translate(CurrentGesture.points, -c1[0], -c1[1])
        }
        CurrentGesture.rotate()
        if (!CurrentGesture.translated) {
            GestureUtils.translate(CurrentGesture.points, c1[0], c1[1])
        }

        var c0 = GestureUtils.computeCentroid(Points)

        var dx = c1[0] - c0[0]
        var dy = c1[1] - c0[1]

        if (CurrentGesture.translated) {
            Centroid = [0, 0]
        } else {
            Centroid = [c1[0] - dx, c1[1] - dy]
        }

        Points = []
        CurrentGesture.points.forEach(function (p) {
            Points.push([p[0] - dx, p[1] - dy])
        })
    }
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

Config.default = {
    threshold: 0.25,
    sampleCount: 32,
    orientationCount: 1,
    ratioSensitive: false,
    scaleOBB: false,
    scaleSize: 200,
}

var GestureImgs = {};
var originalPoint = [0, 0]


var game;

var gestureTool = new GestureTool()

var Points = [];
var RecordPoints = {};

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
