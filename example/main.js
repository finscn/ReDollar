Config.width = 800;
Config.height = 500;
Config.loadDefaultGesture = false;

var dollarOne = new RD.DollarOne({

});
if (Config.loadDefaultGesture) {
    RD.applyDefaultOne(dollarOne);
}

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
                    if (!game.record) {
                        var t = Date.now();
                        MatchGesture = dollarOne.recognize(Points, !true);
                        recognizeTime = Date.now() - t;
                    }
                    var polyline = dollarOne.createPolyline(Points);
                    polyline.init();
                    NormalPoints = polyline.points;
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
                context.fillStyle = "#660000";
                context.fillRect(tx - 2, ty - 2, 4, 4);
                var size = dollarOne.normalSize;
                context.strokeStyle = "#666666";
                context.strokeRect(tx - size / 2, ty - size / 2, size, size);

                var gestures = dollarOne.gesturePool;
                if (this.game.record) {
                    var checks = $name("gesture");
                    var name = getCheckOption(checks);
                    var p = Records[name];
                    if (p) {
                        drawPoly(context, p, "red", 0, 0);
                        // drawPoly(context, p, "red", tx,ty);
                    }
                }
                if (Points.length > 0) {
                    context.lineWidth = 3;
                    context.globalAlpha = 0.6;

                    var g = gestures[MatchGesture];
                    if (g) {
                        drawPoly(context, g.points, "red", tx, ty);
                    }
                    if (NormalPoints) {
                        drawPoly(context, NormalPoints, "lightgreen", tx, ty);
                        context.fillStyle = "blue";
                        context.fillText((MatchGesture || "( Unknown )") + "   " + recognizeTime + "ms", 10, 50);
                    }
                    context.lineWidth = 4;
                    drawPoly(context, Points, "blue", 0, 0);
                    context.globalAlpha = 1;

                }
            }
        }
    }
});
