let mockPlaybackInfo = {playbackPosition: 0, assetDuration: 0};


function getPlaybackInfo() {
    const playbackInfoStr = window.getPlaybackInfo ? window.getPlaybackInfo() : JSON.stringify(mockPlaybackInfo);
    let playbackInfo = {};
    try {
        playbackInfo = JSON.parse(playbackInfoStr);
    } catch (e) {
        console.error(`Playback Info parse failed. playbackStr = ${playbackInfoStr}`);
    }

    return playbackInfo;
}

function setPlaybackInfo(playbackInfo) {

    try {
        const playbackInfoStr = JSON.stringify(playbackInfo);
        if (window.setPlaybackInfo) {
            window.setPlaybackInfo(playbackInfoStr);
        } else {
            mockPlaybackInfo = playbackInfo;
        }
    } catch (e) {
        console.error("Playback Info to json string failed");
    }

}


function resume(url) {
    console.log(`-----------resume: playbackUrl = ${url}, window.cefQuery = ${window.cefQuery}`);
    if (url && window.cefQuery) {
        window.cefQuery({
            request: JSON.stringify({ url, action: "resume"}),
            persistent: false,
            onSuccess: (response) => {
                console.log(`success: ${response}`);
            },
            onFailure: (code, msg) => {
                console.log(`failure: ${code} ${msg}`);
            }
        });
    }
}

/** @namespace remotePlayer
 *@example
 * import { remotePlayer } from "@ip-synamedia/hs-sdk";
 **/
export const remotePlayer = {
    /**
     * Load URL to remote player
     * @param {string} url - playable URL
     */
    load: function load(url) {
        console.log(`-----------load: playbackUrl = ${url}, window.cefQuery = ${window.cefQuery}`);
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
     * Unload remote player
     * @param {string} url - playable URL
     */
    unload:function unload(url) {
        console.log(`-----------unload: playbackUrl = ${url}, window.cefQuery = ${window.cefQuery}`);
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
    play: function play(url = "") {
        console.log(`-----------play: playbackUrl = ${url}, window.cefQuery = ${window.cefQuery}`);
        if (window.cefQuery) {
            window.cefQuery({
                request: JSON.stringify({ url, action: "play"}),
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
     * @deprecated
     */
    resume,


    /**
     * Getter/Setter for currentTime
     */
    get currentTime () {
        const playbackInfo = getPlaybackInfo();
        return playbackInfo?.playbackPosition;
    },
    set currentTime(playbackPosition) {
        setPlaybackInfo({playbackPosition});
    },

    /**
     * For VOD asset, the duration of the asset
     * @readonly
     */
    get duration() {
        const playbackInfo = getPlaybackInfo();
        return playbackInfo?.assetDuration;
    }
};
