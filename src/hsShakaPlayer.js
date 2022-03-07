import { getPlatformInfo, isRunningE2E } from "./api";
const remotePlayer = require("./remotePlayer");

let remotePlaybackAfterSeconds = 0;

// TODO: move it to top level of sessionStorage once ui-streamer supports it (currently needs to be under 'state')
function getLoadedUrlFromSessionStorage() {
    let state = window.sessionStorage.getItem("state");
    state = state || "{}";
    state = JSON.parse(state);
    return state.hyperscaleLoadedUrl;
}

function saveLoadedUrlInSessionStorage(loadedUrl) {
    let state = window.sessionStorage.getItem("state");
    state = state || "{}";
    state = JSON.parse(state);
    state.hyperscaleLoadedUrl = loadedUrl;
    state = JSON.stringify(state);
    window.sessionStorage.setItem("state", state);
}

let playerTimerId = 0;
let shakaPlayerMediaElement;

const shakaPlayerHandler = {
    get: function (target, property) {
        if (property === "load") {
            return new Proxy(target[property], {
                apply: (target, thisArg, argumentsList) => {
                    const loadedUrl = getLoadedUrlFromSessionStorage();
                    console.log(`---ON load of ${argumentsList[0]}, loaded url = ${loadedUrl}`);
                    if (isRunningE2E && argumentsList && argumentsList[0]) {
                        if (playerTimerId > 0) {
                            clearTimeout(playerTimerId);
                            playerTimerId = 0;
                        }
                        // If the UI is trying to load a url that is already loaded, we don't want to call the remote player's load.
                        // This can happen when the UI is reloaded after uiRelease and it calls Shaka player's load.
                        if (loadedUrl !== argumentsList[0]) {
                            if (loadedUrl) {
                                remotePlayer.unload(loadedUrl);
                            }
                            remotePlayer.load(argumentsList[0]);
                            if (argumentsList.length > 1 && argumentsList[1] > 0) {
                                remotePlayer.currentTime = argumentsList[1];
                            }
                            saveLoadedUrlInSessionStorage(argumentsList[0]);
                        }
                    }
                    return Reflect.apply(target, thisArg, argumentsList);
                }
            });
        } else if (property === "unload" || property === "detach") {
            return new Proxy(target[property], {
                apply: (target, thisArg, argumentsList) => {
                    console.log(`---ON ${property} of ${thisArg.getAssetUri()}`);
                    if (isRunningE2E && thisArg.getAssetUri()) {
                        if (playerTimerId > 0) {
                            clearTimeout(playerTimerId);
                            playerTimerId = 0;
                        }
                        remotePlayer.unload(thisArg.getAssetUri());
                        saveLoadedUrlInSessionStorage(undefined); // undefined or ""?
                    }
                    return Reflect.apply(target, thisArg, argumentsList);
                }
            });
        }
        return target[property];
    },
    set: function (...args) {
        return Reflect.set(...args);
    }
};

module.exports = function HsShakaPlayer(ShakaInstance) {

    ShakaInstance.addEventListener("onstatechange", (e) => {
        if (e.state === "load") {
            console.log("---ON state changed to load, asset uri =", ShakaInstance.getAssetUri());
        } else if (e.state === "unload") {
            console.log("---ON state changed to unload, asset uri =", ShakaInstance.getAssetUri());
            if (playerTimerId > 0) {
                clearTimeout(playerTimerId);
                playerTimerId = 0;
            }
        } else if (e.state === "media-source") {
            console.log("---ON state changed to media-source");
            const mediaElement = ShakaInstance.getMediaElement();
            console.log("mediaElement", mediaElement);
            if (mediaElement && shakaPlayerMediaElement !== mediaElement) {
                console.log("Adding event listeners");
                // if (shakaPlayerMediaElement) {
                //     // remove all event listeners
                // }
                shakaPlayerMediaElement = mediaElement;
                remotePlaybackAfterSeconds = getPlatformInfo().sessionInfo?.settings?.webUI?.remotePlaybackAfterSeconds ?? remotePlaybackAfterSeconds;
                // If remotePlaybackAfterSeconds is set to 0 it means that we want to switch to remote player immediately
                // (as opposed to playing locally for a few seconds and then switch to remote player). In this case, we
                // want to avoid flickering so we mute and hide the local player media element.
                if (isRunningE2E && remotePlaybackAfterSeconds === 0) {
                    shakaPlayerMediaElement.muted = true;
                    shakaPlayerMediaElement.setAttribute("style", "visibility: hidden;");
                }
                document.addEventListener("EOS", () => {
                    console.log("---ON EOS");
                    shakaPlayerMediaElement.dispatchEvent(new CustomEvent("ended"));
                });
                document.addEventListener("ERR", (event) => {
                    console.log("---ON ERR", event.detail);
                    shakaPlayerMediaElement.dispatchEvent(new CustomEvent("error", event));
                });
                shakaPlayerMediaElement.addEventListener("seeked", () => {
                    console.log("---ON seeked to position", shakaPlayerMediaElement.currentTime);
                    if (isRunningE2E) {
                        const currentTime = remotePlayer.currentTime;
                        console.log("Remote player position =", currentTime);
                        if (currentTime?.toFixed(3) !== shakaPlayerMediaElement.currentTime.toFixed(3)) {
                            remotePlayer.currentTime = shakaPlayerMediaElement.currentTime;
                        }
                    }
                });
                shakaPlayerMediaElement.addEventListener("play", () => {
                    console.log("---ON play of", ShakaInstance.getAssetUri());
                    if (isRunningE2E && ShakaInstance.getAssetUri()) {
                        if (remotePlaybackAfterSeconds > 0) {
                            if (playerTimerId > 0) {
                                clearTimeout(playerTimerId);
                            }
                            playerTimerId = setTimeout(() => {
                                const currentTime = shakaPlayerMediaElement.currentTime;
                                console.log("Setting remote playback position to", currentTime, "and calling play");
                                remotePlayer.currentTime = currentTime;
                                remotePlayer.play();
                                playerTimerId = 0;
                            }, remotePlaybackAfterSeconds * 1000);
                        } else {
                            console.log("Remote player position =", remotePlayer.currentTime, ", local player position =", shakaPlayerMediaElement.currentTime);
                            remotePlayer.currentTime = shakaPlayerMediaElement.currentTime;
                            remotePlayer.play();
                        }
                    }
                });
                shakaPlayerMediaElement.addEventListener("pause", () => {
                    console.log("---ON pause");
                    console.log("Remote player position =", remotePlayer.currentTime, ", local player position =", shakaPlayerMediaElement.currentTime);
                    if (playerTimerId > 0) {
                        clearTimeout(playerTimerId);
                        playerTimerId = 0;
                    }
                });
                shakaPlayerMediaElement.addEventListener("ended", () => {
                    console.log("---ON ended");
                    if (playerTimerId > 0) {
                        clearTimeout(playerTimerId);
                        playerTimerId = 0;
                    }
                });
            }
        }
    });

    return new Proxy(ShakaInstance, shakaPlayerHandler);
};
