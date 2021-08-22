"use strick";

Config.width = 800;
Config.height = 600;
var originalPoint = [0, 0]

var gestureTool = new GestureTool()

gestureTool.threshold = 0.3 * 100

gestureTool.pointCount = 32
gestureTool.orientationCount = 1
gestureTool.ratioSensitive = false
gestureTool.scaleSize = 200


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


var game = new Game({
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
                context.lineWidth = 1;
                context.fillStyle = "#f3f3f3";
                context.fillRect(0, 0, this.width, this.height);

                var tx = originalPoint[0];
                var ty = originalPoint[1];

                var l = 400;
                drawLine(context, [-l, 0], [l, 0], "#bbbbbb", tx, ty);
                drawLine(context, [0, -l], [0, l], "#bbbbbb", tx, ty);
                drawLine(context, [-l, -l], [l, l], "#bbbbbb", tx, ty);
                drawLine(context, [l, -l], [-l, l], "#bbbbbb", tx, ty);
                context.fillStyle = "#330000";
                context.fillRect(tx - 3, ty - 3, 6, 6);


                var names = Object.keys(RecordPoints)
                if (names.length == 1) {
                    var points = RecordPoints[names[0]]
                    context.lineWidth = 2;
                    drawPoly(context, points, "#bb9999", tx, ty);
                }

                if (step >= 3) {
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
                if (step >= 3) {
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


///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////




function init() {
    loadGestures();
    game.init();
}

function reset() {
    step = 0;
    Points = [];
    CurrentGesture = null;
    Centroid = null;
    MatchGesture = null;
    recognizeTime = 0;
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

var GestureImgs = {};

function loadGestures() {

    const rec = window.localStorage.getItem('RecordPoints')
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

    $id("gcount").innerHTML = count;
}

var gid = 0;

function addGesture() {
    if (!CurrentGesture) {
        return;
    }

    var name = null; // prompt("手势名称", "");
    if (!name) {
        name = 'N_' + Object.keys(RecordPoints).length
    }

    this.gestureTool.addGesture(name, CurrentGesture)
    this.gestureTool.saveGestures();

    RecordPoints[name] = CurrentGesture.points
    window.localStorage.setItem('RecordPoints', JSON.stringify(RecordPoints))

    var names = gestureTool.getAllGestureNames();
    var count = names.length
    $id("gcount").innerHTML = count;
}


function clearAllGestures() {
    gestureTool.removeAllGestures();
    gestureTool.saveGestures();

    RecordPoints = {}
    window.localStorage.setItem('RecordPoints', JSON.stringify(RecordPoints))

    Points = [];
    $id("gcount").innerHTML = 0;
}


function testGesture(transform) {
    if (!CurrentGesture) {
        return
    }
    if (transform) {
        CurrentGesture.transform()
    }
    CurrentGesture.vectorize()
    var t, result

    var list = [
        Similarity.Euclidean,
        Similarity.Cos,
        Similarity.OptimalCos
    ]

    list.forEach(function (sim) {
        console.log('** similarity:', sim)
        t = Date.now();
        gestureTool.similarity = sim
        result = gestureTool.recognize(CurrentGesture.vector);
        recognizeTime = Date.now() - t;
        console.log(result, recognizeTime)
    })

    MatchGesture = result
    if (!MatchGesture) {
        MatchGesture = false;
    }
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

function computeVectorAABB(vector) {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (let i = 0, len = vector.length; i < len; i += 2) {
        minX = Math.min(minX, vector[i])
        maxX = Math.max(maxX, vector[i])
        minY = Math.min(minY, vector[i + 1])
        maxY = Math.max(maxY, vector[i + 1])
    }
    return [
        minX,
        minY,
        maxX - minX,
        maxY - minY
    ]
}

function $id(id) {
    return document.getElementById(id);
}

function $name(name) {
    return document.getElementsByName(name);
}




var step = 0;


function doScale() {
    if (step === 0 && CurrentGesture) {
        step++;

        var c0 = GestureUtils.computeCentroid(CurrentGesture.inputPoints)
        CurrentGesture.scale()
        var c1 = GestureUtils.computeCentroid(CurrentGesture.inputPoints)
        var dx = c1[0] - c0[0]
        var dy = c1[1] - c0[1]

        Points = []
        CurrentGesture.inputPoints.forEach(function (p) {
            Points.push([p[0] - dx, p[1] - dy])
        })
    }
}

function doResample() {
    if (step === 1 && CurrentGesture) {
        step++;

        var c0 = GestureUtils.computeCentroid(Points)

        CurrentGesture.resample()

        var c1 = GestureUtils.computeCentroid(CurrentGesture.points)
        var dx = c1[0] - c0[0]
        var dy = c1[1] - c0[1]

        Points = []
        CurrentGesture.points.forEach(function (p) {
            Points.push([p[0] - dx, p[1] - dy])
        })
    }
}

function doTranslate() {
    if (step === 2 && CurrentGesture) {
        step++;
        Centroid = [0, 0]
        CurrentGesture.translate()
        Points = CurrentGesture.points;
    }
}

function doRotate() {
    if (step === 3 && CurrentGesture) {
        step++;
        CurrentGesture.rotate()
        Points = CurrentGesture.points;
    }
}


//