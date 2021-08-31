"use strick";


Config.saveKey = "GestureTemplate"
Config.storePrefix = ""

for (var p in Config.default){
    gestureTool[p] = Config.default[p]
}


function init() {
    loadGestures();
    initGame();
    $id('toolbar').style.left = ($id('canvas').clientLeft + $id('canvas').clientWidth + 4) + 'px'
    $id('toolbar').style.top = 4 + 'px'
}


///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////


function addGesture() {
    if (!CurrentGesture) {
        return;
    }

    if (!CurrentGesture.scaled) {
        CurrentGesture.scale()
    }
    if (!CurrentGesture.resampled) {
        CurrentGesture.resample()
    }
    if (!CurrentGesture.translated) {
        CurrentGesture.translate()
    }
    if (!CurrentGesture.rotated) {
        CurrentGesture.rotate()
    }

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
        CurrentGesture.transform()
        step = 4
        Points = CurrentGesture.points
        Centroid = [0, 0]
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

    if (result && result.success) {
        MatchGesture = result.gesture
    }

    if (!MatchGesture) {
        MatchGesture = false;
    }
}


//
