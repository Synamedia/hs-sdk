import {remotePlayer} from "../src/api";

test("load", () => {
    const url = "TestURL";

    window.cefQuery = function (params) {
        const request = JSON.parse(params.request);
        expect(request.action).toEqual("load");
        expect(request.url).toEqual(url);
        return params.onSuccess("success");
    };
    const cefQuerySpy = jest.spyOn(window, "cefQuery");
    remotePlayer.load(url);
    expect(cefQuerySpy).toHaveBeenCalledTimes(1);
});

test("unload", () => {
    const url = "TestURL";

    window.cefQuery = function (params) {
        const request = JSON.parse(params.request);
        expect(request.action).toEqual("unload");
        expect(request.url).toEqual(url);
        return params.onSuccess("success");
    };
    const cefQuerySpy = jest.spyOn(window, "cefQuery");
    remotePlayer.unload(url);
    expect(cefQuerySpy).toHaveBeenCalledTimes(1);
});

test("play", () => {
    window.cefQuery = function (params) {
        const request = JSON.parse(params.request);
        expect(request.action).toEqual("play");
        return params.onSuccess("success");
    };
    const cefQuerySpy = jest.spyOn(window, "cefQuery");
    remotePlayer.play();
    expect(cefQuerySpy).toHaveBeenCalledTimes(1);
});

test("get currentTime and duration", () => {
    const currentTime = 300;
    const duration = 3600;

    window.getPlaybackInfo = function () {
        return JSON.stringify({playbackPosition: currentTime, assetDuration: duration});
    };
    const getPlaybackInfoSpy = jest.spyOn(window, "getPlaybackInfo");
    expect(remotePlayer.currentTime).toEqual(currentTime);
    expect(remotePlayer.duration).toEqual(duration);
    expect(getPlaybackInfoSpy).toHaveBeenCalledTimes(2);
});

test("set currentTime", () => {
    const currentTime = 300;

    window.setPlaybackInfo = function (playbackInfoStr) {
        expect(JSON.parse(playbackInfoStr).playbackPosition).toEqual(currentTime);
    };
    const setPlaybackInfoSpy = jest.spyOn(window, "setPlaybackInfo");
    remotePlayer.currentTime = currentTime;
    expect(setPlaybackInfoSpy).toHaveBeenCalledTimes(1);
});
