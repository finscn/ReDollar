Config.width = 800;
Config.height = 500;

var dollarOne = new RD.DollarOne({
    threshold : Math.PI/12
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
                context.fillStyle = "#660000";
                context.fillRect(tx - 2, ty - 2, 4, 4);

                if (step == 5) {
                    var size = dollarOne.normalSize;
                    context.strokeStyle = "#666666";
                    context.strokeRect(tx - size / 2, ty - size / 2, size, size);
                }
                if (MatchGesture) {
                    context.fillStyle = "blue";
                    context.fillText(recognizeTime + "ms", 10, 50);
                }else if (MatchGesture===false){
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
                        }else{
                            drawPoly(context, g.points, "#999999", tx, ty);
                        }
                    }

                    if (step >= 3) {
                        context.save();
                        context.translate(this.width / 2, this.height / 2);
                    }
                    if (Points && Points.length>3){
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
                        context.fillRect(Centroid[0] - 5, Centroid[1] - 5, 10, 10)
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
