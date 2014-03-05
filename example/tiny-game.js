"use strict";


var Config = Config || {
    width: 960,
    height: 640,
    FPS: 60,
};

function isIOS() {
    if (typeof window != "undefined" && window.navigator && window.navigator.userAgent && window.navigator.userAgent.toLowerCase) {
        var ua = window.navigator.userAgent.toLowerCase();
        var iPhone = /iphone/.test(ua);
        var iPad = /ipad/.test(ua);
        var iPod = /ipod/.test(ua);
        var iOS = iPhone || iPad || iPod;
        var l = window.location;
        var inBroswer = l && l.replace && l.reload;
        return iOS && inBroswer;
    }
    return false;
}

function loadResource(resList, onloading, onloaded) {
    if (!onloaded) {
        onloaded = onloading;
        onloading = null;
    }
    var reses = {};
    var totalCount = resList.length;
    var loadedCount = 0;


    var onLoad = function() {
        loadedCount++;
        if (this.play) {
            this.removeEventListener("canplaythrough", onLoad);
        } else {
            this.removeEventListener("load", onLoad);
        }
        if (onloading) {
            onloading(loadedCount, totalCount, this);
        }
    };

    var isAudio = function(res) {
        var src = res.src || res.url;
        return res.type == "audio" || src.indexOf(".mp3") > 0 || src.indexOf(".ogg") > 0 || src.indexOf(".wav") > 0
    };

    var iOS = isIOS();

    for (var i = 0; i < totalCount; i++) {
        var res = resList[i];
        res.id = res.id || res.src || res.url;
        res.src = res.src || res.url || res.id;
        if (isAudio(res)) {
            var audio = reses[res.id] = new Audio();
            audio.src = res.src;
            audio.loop = res.loop || false;
            audio.preload = true;
            audio.autobuffer = true;
            if (iOS) {
                loadedCount++;
                if (onloading) {
                    onloading(loadedCount, totalCount, audio);
                }
            } else {
                audio.addEventListener("canplaythrough", onLoad);
                audio.load();
            }
        } else {
            var image = reses[res.id] = new Image();
            image.src = res.src;
            image.addEventListener("load", onLoad);
        }
    }

    function check() {
        if (loadedCount >= totalCount && onloaded) {
            onloaded(reses, totalCount);
        } else {
            setTimeout(check, 100);
        }
    }
    check();

    return reses;
}

function loadJS(jspath, onload, id) {
    if (!jspath) {
        return false;
    }

    // jspath = jspath + "?tamp=" + Date.now();
    var head = document.getElementsByTagName("head")[0] || document.documentElement;

    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = jspath;
    script.defer = false;
    var done = false;
    script.onload = script.onreadystatechange = function(event) {
        if (!done &&
            (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
            done = true;
            if (onload) {
                onload(event);
            }
            this.onload = this.onreadystatechange = this.onerror = null;
        }
    };
    script.onerror=function(e){
        if (onload) {
            onload(e);
        }
        this.onload = this.onreadystatechange = this.onerror = null;
    };
    if (id) {
        script.id = id;
    }
    head.appendChild(script);
}


var ResourcePool = {
    cache: {},
    _count: 0,
    get: function(id, clone) {
        var res = this.cache[id] || null;
        if (clone && res != null) {
            res = res.cloneNode(true);
        }
        // id && console.log(id);
        return res;
    },
    add: function(id, res) {
        this.cache[id] = res;
        this._count++;
    },
    remove: function(id) {
        var res = this.cache[id];
        delete this.cache[id];
        this._count--;
    },
    clear: function() {
        for (var id in this.cache) {
            this.remove(id);
        }
        this.cache = {};
        this._count = 0;
    },
    size: function() {
        return this._count;
    }
};


function Game(options) {
    for (var p in options) {
        this[p] = options[p];
    }
}

Game.prototype = {
    constructor: Game,

    canvas: "canvas",
    context: null,
    running: false,
    paused: false,
    tickId: null,
    timer: null,
    scene: null,

    init: function() {

        var canvas = this.canvas = document.getElementById(this.canvas) || this.canvas;
        canvas.retinaResolutionEnabled = true;
        canvas.width = Config.width;
        canvas.height = Config.height;
        if (canvas.style && "ejecta" in window) {
            canvas.style.width = window.innerWidth + "px";
            canvas.style.height = window.innerHeight + "px";
        }
        this.context = canvas.getContext("2d");

        this.onInit();
    },
    onInit: function() {},

    beforeStart: function() {},
    start: function() {
        this.reset();
        this.beforeStart();
        this.timer.now = Date.now();
        this.timer.last = this.timer.now;
        this.running = true;
        this.paused = false;
        this.run();
    },
    pause: function() {
        this.paused = true;
    },
    resume: function() {
        this.paused = false;
    },
    stop: function() {
        this.running = false;
    },
    reset: function() {
        clearTimeout(this.tickId);
        var Me = this;
        this._run = function() {
            Me.run();
        }
        this.timer = {
            now: 0,
            last: 0,
            step: Math.round(1000 / Config.FPS)
        }
    },

    run: function() {
        var now = this.timer.now = Date.now();
        var timeStep = now - this.timer.last;
        this.timer.last = now;

        // static step
        timeStep = this.timer.step;

        this.tickId = setTimeout(this._run, (this.timer.step << 1) - timeStep);
        if (!this.paused && timeStep > 8) {
            this.update(timeStep, now);
            this.render(this.context, timeStep, now);
        }
        if (!this.running) {
            clearTimeout(this.tickId);
        }
    },

    update: function(timeStep, now) {
        if (this.scene) {
            this.scene.update(timeStep, now);
        }
    },
    render: function(context, timeStep, now) {
        if (this.scene) {
            this.scene.render(context, timeStep, now);
        }
    },
};


function pageOnLoad() {

    window.devicePixelRatio = window.devicePixelRatio || 1;
    Config.retinaEnabled = false;
    Config.devicePixelRatio = 1;
    var minPixels = Math.min(Config.width, Config.height) * window.devicePixelRatio;
    if (window.devicePixelRatio > 1 && minPixels <= 1280) {
        Config.retinaEnabled = true;
        Config.devicePixelRatio = window.devicePixelRatio;
        Config.width *= Config.devicePixelRatio;
        Config.height *= Config.devicePixelRatio;
    }
    Config.touchPixelRatio = Config.devicePixelRatio;
    console.log("Config size: ", Config.width, Config.height);


    if (window.ResList) {
        ResList.forEach(function(res) {
            res.src = window.rootPath + res.src;
        })
        var pool = loadResource(ResList, function() {
            for (var id in pool) {
                ResourcePool.add(id, pool[id]);
            }
            if (typeof init == "function") {
                init();
            }
        });
    } else {
        if (typeof init == "function") {
            init();
        }
    }
}


if (!window.rootPath) {
    window.rootPath = "./";
}
window.onload = pageOnLoad;
