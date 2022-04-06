import { getPlatformInfo, isRunningE2E } from "./api";
const remotePlayer = require("./remotePlayer");

const remotePlaybackAfterSeconds = getPlatformInfo().sessionInfo?.settings?.webUI?.remotePlaybackAfterSeconds ?? 0;
const LOADED_URL_KEY = "hs-internal/loadedUrl";

let playerTimerId = 0;
let shakaPlayerMediaElement;
let isPlaying = false;

if (typeof window !== "undefined") {
    document.addEventListener("keydown", (event) => {
        if (shakaPlayerMediaElement && isRunningE2E() && isPlaying) {
            const currentTime = remotePlayer.currentTime;
            console.log(`Got ${event.key} key. Updating local player to ${currentTime}`);
            isPlaying = false;
            shakaPlayerMediaElement.currentTime = currentTime;
        }
    });
    document.addEventListener("EOS", () => {
        console.log("---ON EOS");
        if (shakaPlayerMediaElement && isRunningE2E()) {
            isPlaying = false;
            const currentTime = remotePlayer.currentTime;
            console.log(`Updating local player to ${currentTime}`);
            shakaPlayerMediaElement.currentTime = currentTime;
            shakaPlayerMediaElement.dispatchEvent(new CustomEvent("ended"));
        }
    });
    document.addEventListener("ERR", (event) => {
        console.log("---ON ERR", event.detail);
        if (shakaPlayerMediaElement && isRunningE2E()) {
            isPlaying = false;
            const currentTime = remotePlayer.currentTime;
            console.log(`Updating local player to ${currentTime}`);
            shakaPlayerMediaElement.currentTime = currentTime;
            shakaPlayerMediaElement.dispatchEvent(new CustomEvent("error", event));
        }
    });
}

const shakaPlayerHandler = {
    get: function (target, property) {
        if (property === "load") {
            return new Proxy(target[property], {
                apply: (target, thisArg, argumentsList) => {
                    console.log(`---ON load of ${argumentsList[0]}`);
                    if (shakaPlayerMediaElement?.autoplay) {
                        console.warn("AUTOPLAY IS NOT SUPPORTED!!! Setting autoplay to false");
                        shakaPlayerMediaElement.autoplay = false;
                    }
                    if (isRunningE2E() && argumentsList && argumentsList[0]) {
                        if (playerTimerId > 0) {
                            clearTimeout(playerTimerId);
                            playerTimerId = 0;
                        }
                        // If the UI is trying to load a url that is already loaded, we don't want to call the remote player's load.
                        // This can happen when the UI is reloaded after uiRelease and it calls Shaka player's load.
                        console.log(`loadedUrl = ${window.sessionStorage.getItem(LOADED_URL_KEY)}`);
                        if (window.sessionStorage.getItem(LOADED_URL_KEY) !== argumentsList[0]) {
                            remotePlayer.load(argumentsList[0]);
                            window.sessionStorage.setItem(LOADED_URL_KEY, argumentsList[0]);
                        }
                        if (argumentsList.length > 1 && argumentsList[1] > 0) {
                            console.log("Setting remote and local players current time to", argumentsList[1]);
                            remotePlayer.currentTime = argumentsList[1];
                            if (shakaPlayerMediaElement) {
                                shakaPlayerMediaElement.currentTime = argumentsList[1];
                            }
                        }
                    }
                    const loadPromise = Reflect.apply(target, thisArg, argumentsList);
                    loadPromise.catch(err => {
                        console.log(`Caught load error ${err.code} in SDK`);
                        if (isRunningE2E() && argumentsList && argumentsList[0]) {
                            window.sessionStorage.removeItem(LOADED_URL_KEY);
                            remotePlayer.unload(argumentsList[0]);
                        }
                    });
                    return loadPromise;
                }
            });
        } else if (property === "unload" || property === "detach") {
            return new Proxy(target[property], {
                apply: (target, thisArg, argumentsList) => {
                    console.log(`---ON ${property} of ${thisArg.getAssetUri()}`);
                    if (isRunningE2E() && thisArg.getAssetUri()) {
                        if (playerTimerId > 0) {
                            clearTimeout(playerTimerId);
                            playerTimerId = 0;
                        }
                        window.sessionStorage.removeItem(LOADED_URL_KEY);
                        remotePlayer.unload(thisArg.getAssetUri());
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
    const playHandler = async () => {
        console.log(`video tag PLAY, isPlaying = ${isPlaying}, local player current time = ${shakaPlayerMediaElement.currentTime}`);
        if (!isRunningE2E()) {
            return shakaPlayerMediaElement.origPlay.bind(shakaPlayerMediaElement)();
        }
        if (!isPlaying) {
            isPlaying = true;
            remotePlayer.currentTime = shakaPlayerMediaElement.currentTime;
            return remotePlayer.play();
        }
    };

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
                // TODO: if shakaPlayerMediaElement exists, need to remove all previously added event listeners
                shakaPlayerMediaElement = mediaElement;
                shakaPlayerMediaElement.origPlay = mediaElement.play;
                shakaPlayerMediaElement.play = playHandler;
                // If remotePlaybackAfterSeconds is set to 0 it means that we want to switch to remote player immediately
                // (as opposed to playing locally for a few seconds and then switch to remote player). In this case, we
                // want to avoid flickering so we hide the local player media element.
                if (isRunningE2E() && remotePlaybackAfterSeconds === 0) {
                    shakaPlayerMediaElement.setAttribute("style", "visibility: hidden;");
                }
                // Currently all event listeners are commented out since remotePlaybackAfterSeconds is set to 0
                // and shaka player is not playing.
                /*console.log("Adding event listeners");
                shakaPlayerMediaElement.addEventListener("seeked", () => {
                    console.log("---ON seeked to position", shakaPlayerMediaElement.currentTime);
                    if (isRunningE2E()) {
                        const currentTime = remotePlayer.currentTime;
                        console.log("Remote player position =", currentTime);
                        if (currentTime?.toFixed(3) !== shakaPlayerMediaElement.currentTime.toFixed(3)) {
                            remotePlayer.currentTime = shakaPlayerMediaElement.currentTime;
                        }
                    }
                });
                shakaPlayerMediaElement.addEventListener("play", () => {
                    console.log("---ON play of", ShakaInstance.getAssetUri());
                    if (isRunningE2E() && ShakaInstance.getAssetUri()) {
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
                });*/
            }
        }
    });

    return new Proxy(ShakaInstance, shakaPlayerHandler);
};
