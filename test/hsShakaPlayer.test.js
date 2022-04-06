import {HsShakaPlayer, remotePlayer} from "../src/api";
import shaka from "shaka-player";

const LOADED_URL_KEY = "hs-internal/loadedUrl";
const playbackInfo = {playbackPosition: 0, assetDuration: 0};
window.setPlaybackInfo = function(playbackInfoStr) {
    const parsedObj = JSON.parse(playbackInfoStr);
    playbackInfo.playbackPosition = parsedObj.playbackPosition;
    playbackInfo.assetDuration = parsedObj.assetDuration;
};
window.getPlaybackInfo = function() {
    return JSON.stringify(playbackInfo);
};

test("happy flow - load, play and unload", async () => {
    window.cefQuery = function (params) {
        return params.onSuccess("success");
    };
    const remotePlayerLoadSpy = jest.spyOn(remotePlayer, "load");
    const remotePlayerUnloadSpy = jest.spyOn(remotePlayer, "unload");
    const remotePlayerPlaySpy = jest.spyOn(remotePlayer, "play");
    const url = "testURL";
    const videoTag = document.createElement("video");
    videoTag.autoplay = true;
    videoTag.play = function () {
        console.log("Mocking original play");
        return new Promise((resolve) => {
            resolve();
        });
    };
    const shakaPlayerInstance = new shaka.Player(videoTag, (shakaInstance) => {
        shakaInstance.load = function () {
            console.log("Mocking original load");
            return new Promise((resolve) => {
                resolve("success");
            });
        };
        shakaInstance.unload = function () {
            console.log("Mocking original unload");
            return new Promise((resolve) => {
                resolve("success");
            });
        };
        shakaInstance.getMediaElement = function () {
            console.log("Mocking original getMediaElement");
            return videoTag;
        };
        shakaInstance.getAssetUri = function () {
            return url;
        };
    });
    const player = new HsShakaPlayer(shakaPlayerInstance);
    // In the real app, shaka player dispatches onstatechange event with state = "media-source".
    // In the test environment it doesn't happen, so we trigger the event explicitly.
    const event = new Event("onstatechange");
    event.state = "media-source";
    shakaPlayerInstance.dispatchEvent(event);
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(videoTag.getAttribute("style")).toEqual("visibility: hidden;");
    expect(videoTag).toHaveProperty("origPlay");
    // load
    expect(await player.load(url)).toEqual("success");
    expect(videoTag.autoplay).toEqual(false);
    expect(window.sessionStorage.getItem(LOADED_URL_KEY)).toEqual(url);
    expect(remotePlayerLoadSpy).toHaveBeenCalledTimes(1);
    expect(remotePlayerLoadSpy).toHaveBeenCalledWith(url);
    // play
    await videoTag.play();
    expect(remotePlayerPlaySpy).toHaveBeenCalledTimes(1);
    expect(remotePlayer.currentTime).toEqual(0);
    // unload
    expect(await player.unload()).toEqual("success");
    expect(remotePlayerUnloadSpy).toHaveBeenCalledTimes(1);
    expect(remotePlayerUnloadSpy).toHaveBeenCalledWith(url);
    expect(window.sessionStorage.getItem(LOADED_URL_KEY)).toEqual(null);
});
