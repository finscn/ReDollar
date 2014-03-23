Config.width = 800;
Config.height = 500;

var dollarOne = new RD.DollarOne({
    threshold: Math.PI / 12
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
                    Points.push([TouchInfo.x, TouchInfo.y]);
                    this.cooldown = 2;
                }
                this.cooldown--;
            },
            render: function(context, timeStep, now) {
                context.lineWidth = 1;
                context.fillStyle = "#eeeeee";
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

                if (step == 5) {
                    var size = dollarOne.normalSize;
                    context.strokeStyle = "#666666";
                    context.strokeRect(tx - size / 2, ty - size / 2, size, size);
                }
                if (MatchGesture) {
                    context.fillStyle = "blue";
                    context.fillText(MatchGesture + "   " + recognizeTime + "ms", 10, 50);
                } else if (MatchGesture === false) {
                    context.fillStyle = "red";
                    context.fillText("null", 10, 50);
                }

                // if (Points.length > 0) {

                // MatchGesture = "tmpl"
                var g = dollarOne.getGesture("tmpl");
                if (g) {
                    context.lineWidth = 2;
                    if (MatchGesture) {
                        drawPoly(context, g.points, "#00cc00", tx, ty);
                    } else {
                        drawPoly(context, g.points, "#bb9999", tx, ty);
                    }
                }

                if (step >= 3) {
                    context.save();
                    context.translate(this.width / 2, this.height / 2);
                }
                if (Points && Points.length > 3) {
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
    $id("gcount").innerHTML = gid;
}

var gid = 0;

function addGesture() {
    saveGesture(++gid);
    $id("gcount").innerHTML = gid;
}

function saveGesture(name) {
    name = name || "tmpl";
    // var polyline = dollarOne.createPolyline(Points);
    // polyline.init();
    // polyline.points.forEach(function(p) {
    //     p[0] = (p[0] + game.width / 2) >> 0;
    //     p[1] = (p[1] + game.height / 2) >> 0;
    // })
    // Records[name] = polyline.points;
    Records[name] = Points;
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
    $id("gcount").innerHTML = gid;
}

function removeRecorded(name) {
    if (!name) {
        Records = {};
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
        TouchInfo.x = touch.clientX;
        TouchInfo.y = touch.clientY;
        event.preventDefault();
    }, true);

    dom.addEventListener(move, function() {
        var touch = useTouch ? event.changedTouches[0] : event;

        if (TouchInfo.touched) {
            TouchInfo.x = touch.clientX;
            TouchInfo.y = touch.clientY;
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
        polyline.vector = polyline.vectorize();
    }
}

function rotate() {
    if (polyline) {
        step++;
        polyline.angle = polyline.indicativeAngle();
        polyline.rotateBy(-polyline.angle);
    }
}




//
