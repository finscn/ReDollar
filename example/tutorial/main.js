"use strick";

Config.width = 800;
Config.height = 600;

var dollarOne = new RD.DollarOne({
    threshold: 0.3,
    ratio1D: 0.2,
    rotationInvariance: Math.PI / 4,
    normalPointCount: 40,
    normalSize: 200,
});

var game = new Game({
    width: Config.width,
    height: Config.height,
    onInit: function() {
        initTouchEvent(this.canvas);
        var x = this.width / 2,
            y = this.height / 2;

        this.start();
    },
    beforeStart: function() {
        this.context.font = "20px Arial";
        this.scene = {
            width: this.width,
            height: this.height,
            game: this,
            cooldown: 0,
            afterDraw: function() {
                if (Points.length > 6) {

                    polyline = dollarOne.createPolyline(Points);
                }
            },
            update: function(timeStep, now) {
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
            render: function(context, timeStep, now) {
                context.lineWidth = 1;
                context.fillStyle = "#f3f3f3";
                context.fillRect(0, 0, this.width, this.height);
                var tx = this.width / 2,
                    ty = this.height / 2;
                var l = 400;
                drawLine(context, [-l, 0], [l, 0], "#bbbbbb", tx, ty);
                drawLine(context, [0, -l], [0, l], "#bbbbbb", tx, ty);
                drawLine(context, [-l, -l], [l, l], "#bbbbbb", tx, ty);
                drawLine(context, [l, -l], [-l, l], "#bbbbbb", tx, ty);
                context.fillStyle = "#330000";
                context.fillRect(tx - 3, ty - 3, 6, 6);

                // if (step >=4 ) {
                //     var size = dollarOne.normalSize;
                //     context.strokeStyle = "#666666";
                //     context.strokeRect(tx - size / 2, ty - size / 2, size, size);
                // }

                // if (Points.length > 0) {

                var pool = dollarOne.gesturePool;
                var names = Object.keys(pool);
                if (names.length == 1) {
                    var g = dollarOne.getGesture(names[0]);
                    context.lineWidth = 2;
                    drawPoly(context, g.points, "#bb9999", tx, ty);
                    // var size=g.normalSize;
                    // console.log(size)
                    // context.strokeRect(-size/2+tx,-size/2+ty,size,size)
                }

                if (step >= 3) {
                    context.save();
                    context.translate(this.width / 2, this.height / 2);
                }
                if (Points && Points.length > 0) {
                    context.globalAlpha = 0.6;
                    context.lineWidth = 4;
                    drawPoly(context, Points, "blue", 0, 0);
                    context.fillStyle = "red";
                    Points.forEach(function(p) {
                        context.fillRect(p[0] - 4, p[1] - 4, 8, 8);
                    });
                }
                if (Centroid) {
                    context.fillStyle = "darkgreen";
                    context.fillRect(Centroid[0] - 5, Centroid[1] - 5, 10, 10);
                    drawLine(context, Points[0], Centroid, "#6699ff");
                }

                context.globalAlpha = 1;
                if (step >= 3) {
                    context.restore();
                }
                var x = 0,
                    y = 0;
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


var Records = {};
var Points = [];
var polyline, Centroid;
var MatchGesture = null;
var TouchInfo = {
    touched: false,
    x: 0,
    y: 0,
};
var recognizeTime = 0;


function init() {
    loadGesture();
    game.init();
}

function reset() {
    step = 0;
    Points = [];
    polyline = null;
    Centroid = null;
    MatchGesture = null;
    recognizeTime = 0;
}

function createGestureImg(polyline, size) {
    size = size || 80;
    var aabb = RD.Utils.getAABB(polyline.points);
    var os = Math.max(aabb[4], aabb[5]);
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
    drawPoly(context, polyline.points, "#3366ff");
    context.restore();
    return canvas;
}

var GestureImgs = {};

function loadGesture() {
    var r = window.localStorage.getItem("Records");
    if (r) {
        Records = JSON.parse(r);
    }
    gid = 0;
    dollarOne.removeGesture();
    for (var name in Records) {
        gid++
        // console.log(name,Records[name])
        dollarOne.addGesture(name, Records[name]);
    }
    var pool = dollarOne.gesturePool;
    for (var name in pool) {
        var g = pool[name];
        var img = createGestureImg(g);
        GestureImgs[name] = img;
    }
    $id("gcount").innerHTML = gid;
}

var gid = 0;

function addGesture() {
    if (!Points) {
        return;
    }
    saveGesture(++gid);
    loadGesture();
    $id("gcount").innerHTML = gid;
}

function saveGesture(name) {
    if (!Points) {
        return;
    }
    Records[name] = Points;
    // var polyline = dollarOne.createPolyline(Points);
    // polyline.init();
    // Records[name] = polyline.points;

    var str = JSON.stringify(Records);
    window.localStorage.setItem("Records", str);
    dollarOne.addGesture(name, polyline.points);

    // dollarOne.removeGesture();
    // for (var name in Records) {
    //     dollarOne.addGesture(name, Records[name]);
    // }
}

function testGesture() {
    var t = Date.now();
    MatchGesture = dollarOne.recognize(Points);
    recognizeTime = Date.now() - t;
    console.log(MatchGesture, recognizeTime)
    if (!MatchGesture) {
        MatchGesture = false;
    }
}

function addRecorded(name, points) {
    Records[name] = points;
}

function removeGesture() {
    removeRecorded();
    dollarOne.removeGesture();
    gid = 0;
    Points = [];
    $id("gcount").innerHTML = gid;
}

function removeRecorded(name) {
    if (!name) {
        Records = {};
        GestureImgs = {};
    } else {
        delete Records[name];
    }
    window.localStorage.setItem("Records", "{}");
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

    dom.addEventListener(start, function(event) {
        var touch = useTouch ? event.changedTouches[0] : event;
        reset();
        TouchInfo.touched = true;
        TouchInfo.lastX = -1000;
        TouchInfo.lastY = -1000;
        TouchInfo.x = touch.pageX;
        TouchInfo.y = touch.pageY;
        event.preventDefault();
    }, true);

    dom.addEventListener(move, function() {
        var touch = useTouch ? event.changedTouches[0] : event;

        if (TouchInfo.touched) {
            TouchInfo.x = touch.pageX;
            TouchInfo.y = touch.pageY;
        }
        event.preventDefault();
    }, true);

    dom.addEventListener(end, function() {
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

function $id(id) {
    return document.getElementById(id);
}

function $name(name) {
    return document.getElementsByName(name);
}




var step = 0;

function resample() {
    if (polyline) {
        step++;
        polyline.origPoints = polyline.points;
        polyline.points = RD.Utils.resample(polyline.origPoints, polyline.normalPointCount);
        polyline.pointCount = polyline.points.length;
        Points = polyline.points;
    }
}

function centroid() {
    if (polyline) {
        step++;

        polyline.firstPoint = polyline.points[0];
        polyline.aabb = RD.Utils.getAABB(polyline.points);
        polyline.centroid = polyline.getCentroid();
        Centroid = polyline.centroid;
    }
}

function translateTo() {
    if (polyline) {
        step++;

        polyline.translateTo(polyline.originX, polyline.originY);
        Centroid = [polyline.originX, polyline.originY];
    }
}

function scale() {
    if (polyline) {
        step++;
        polyline.scaleTo(polyline.normalSize);
    }
}

function rotate() {
    if (polyline) {
        step++;
        polyline.angle = polyline.indicativeAngle();
        polyline.rotateBy(-polyline.angle);
        polyline.vector = polyline.vectorize();
    }
}




//
