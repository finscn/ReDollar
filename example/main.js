"use strick";


Config.saveKey = "GestureTemplate"
Config.storePrefix = ""


function transform() {
    if (!CurrentGesture) {
        return
    }
    if (!CurrentGesture.translated) {
        CurrentGesture.translate()
    }
    if (!CurrentGesture.rotated) {
        CurrentGesture.rotate()
    }
    if (!CurrentGesture.scaled) {
        CurrentGesture.scale()
    }
    if (!CurrentGesture.resampled) {
        CurrentGesture.resample()
    }
}
//
