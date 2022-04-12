function getPlaybackInfo() {
    const playbackInfoStr = window.getPlaybackInfo ? window.getPlaybackInfo() : JSON.stringify({playbackPosition: 0, assetDuration: 0});
    let playbackInfo = {};
    try {
        playbackInfo = JSON.parse(playbackInfoStr);
    } catch (e) {
        console.error(`Playback Info parse failed. playbackStr = ${playbackInfoStr}`);
        playbackInfo = {playbackPosition: 0, assetDuration: 0};
    }

    return playbackInfo;
}

function setPlaybackInfo(playbackInfo) {
    try {
        const playbackInfoStr = JSON.stringify(playbackInfo);
        if (window.setPlaybackInfo) {
            window.setPlaybackInfo(playbackInfoStr);
        }
    } catch (e) {
        console.error("Playback Info to json string failed");
    }
}

/** @namespace remotePlayer
 *@example
 * import { remotePlayer } from "@ip-synamedia/hs-sdk";
 **/
const remotePlayer = {
    /**
     * Load URL to remote player
     * @param {string} url - playable URL
     */
    load: function load(url) {
        console.log(`remote player load: playbackUrl = ${url}, window.cefQuery ${window.cefQuery ? "is" : "is not"} defined`);
        if (url && window.cefQuery) {
            window.cefQuery({
                request: JSON.stringify({ url, action: "load"}),
                persistent: false,
                onSuccess: (response) => {
                    console.log("success: " + response);
                },
                onFailure: (code, msg) => {
                    console.log(`failure: ${code} ${msg}`);
                }
            });
        }
    },
    /**
     * Unload URL from remote player
     * @param {string} url - playable URL
     */
    unload: function unload(url) {
        console.log(`remote player unload: playbackUrl = ${url}, window.cefQuery ${window.cefQuery ? "is" : "is not"} defined`);
        if (url && window.cefQuery) {
            window.cefQuery({
                request: JSON.stringify({ url, action: "unload"}),
                persistent: false,
                onSuccess: (response) => {
                    console.log("success: " + response);
                },
                onFailure: (code, msg) => {
                    console.log(`failure: ${code} ${msg}`);
                }
            });
        }
    },
    /**
     * Play loaded URL. Assuming load was called before.
     */
    play: function play() {
        console.log(`remote player play: window.cefQuery ${window.cefQuery ? "is" : "is not"} defined`);
        if (window.cefQuery) {
            window.cefQuery({
                request: JSON.stringify({ url: "", action: "play"}),
                persistent: false,
                onSuccess: (response) => {
                    console.log("success: " + response);
                },
                onFailure: (code, msg) => {
                    console.log(`failure: ${code} ${msg}`);
                }
            });
        }
    },
    /**
     * Getter/Setter for currentTime
     */
    get currentTime () {
        return getPlaybackInfo()?.playbackPosition;
    },
    set currentTime(playbackPosition) {
        setPlaybackInfo({playbackPosition});
    },

    /**
     * For VOD asset, the duration of the asset
     * @readonly
     */
    get duration() {
        return getPlaybackInfo()?.assetDuration;
    }
};

module.exports = remotePlayer;
