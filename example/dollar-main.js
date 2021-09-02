"use strick";

Config.saveKey = "Dollar_GestureTemplate"
Config.storePrefix = "Dollar"

function transform() {
    if (!CurrentGesture) {
        return
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
    if (!CurrentGesture.scaled) {
        CurrentGesture.scale()
    }

}
//
