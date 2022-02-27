let authToken;
let sessionInfo = "{}";
export async function init() {
    console.log("hs-sdk init");

    if (window.cefQuery) {
        sessionInfo = await (new Promise((resolve, reject) => {
            window.cefQuery && window.cefQuery({
                request: "sessionInfo",
                persistent: false,
                onSuccess: (response) => {
                    console.log("success: " + response);
                   resolve(response);
                },
                onFailure: (code, msg) => {
                    console.log(`failure: ${code} ${msg}`);
                }
            });
        }));

        console.log(`-----------sessionInfo: sessionInfo= ${sessionInfo}`);
        let sessionInfoObj = JSON.parse(sessionInfo);
        authToken = sessionInfoObj?.settings?.webUI?.backendHeaders?.Authorization;
        console.log(`-----------authToken: token= ${authToken}`);
        // Listen to updateSession event to set the new token
        document.addEventListener("updateSession", (e) => {
            authToken = e.detail?.updateObj;
            console.log(`-----------onUpdateSessionEvent: token= ${authToken}`);
        });
    } else {
        authToken = getPlatformInfo().sessionInfo?.settings?.webUI?.backendHeaders?.Authorization;
        console.log(`-----------authToken dummy: token= ${authToken}`);
    }
}

export function diagnostics() {
    console.warn("diagnostics is deprecated, use getPlatformInfo");
    return typeof window !== "undefined" && window.diagnostics ? window.diagnostics() : undefined;
}

export function getPlatformInfo() {
    if (typeof window !== "undefined" && window.diagnostics) {
        try {
            const platformInfo = window.diagnostics() || {};
            platformInfo.sessionInfo = JSON.parse(sessionInfo);
            return platformInfo;
        } catch (e) {
            console.error("Could not get platform info", e.stack);
        }

    } else {
        //console.info("Working on local env (not HS platform) - return dummy info");
        return {
            tenant: "XXXXXXX-XXXXXXX-XXXX",
            version: "X.X.XX-X",
            pod: "ui-streamer-X.X.XX-X-QWERT-ASDFG-XXX-XXXXXX-XXXXX",
            podIP: "0.0.0.0",
            sessionInfo: {
                userAgent: "SynamediaHyperscale/XX.YY.ZZ",
                connectionId: "dummy",
                deviceId: "123456789",
                community: "LocalDev",
                appConnectionId: "dummy_a~App",
                manifest: {
                    transcontainer: "X.X.XX-X"
                },
                settings: {
                    webUI: {
                        backendHeaders: {
                            Authorization: "Bearer dummytoken"
                        }
                    }
                }
            }
        };
    }
}

let mockPlaybackInfo = {playbackPosition: 0, assetDuration: 0};
export function getPlaybackInfo() {
    const playbackInfoStr = window.getPlaybackInfo ? window.getPlaybackInfo() : JSON.stringify(mockPlaybackInfo);
    let playbackInfo = {};
    try {
        playbackInfo = JSON.parse(playbackInfoStr);
    } catch (e) {
        console.error(`Playabck Info parse failed. playbackStr = ${playbackInfoStr}`);
    }

    return playbackInfo;
}

export function setPlaybackInfo(playbackInfo) {

    try {
        const playbackInfoStr = JSON.stringify(playbackInfo);
        if (window.setPlaybackInfo) {
            window.setPlaybackInfo(playbackInfoStr);
        } else {
            mockPlaybackInfo = playbackInfo;
        }
    } catch (e) {
        console.error(`Playabck Info to json string failed`);
    }

}

export function load(url) {
    console.log(`-----------load: playbackUrl = ${url}, window.cefQuery = ${window.cefQuery}`);
    if (url && window.cefQuery) {
        window.cefQuery({
            request: JSON.stringify({ url, action: "load"}),
            persistent: true,
            onSuccess: (response) => {
                console.log("success: " + response);
            },
            onFailure: (code, msg) => {
                console.log(`failure: ${code} ${msg}`);
            }
        });
    }
}

export function play(url = "") {
    console.log(`-----------play: playbackUrl = ${url}, window.cefQuery = ${window.cefQuery}`);
    if (window.cefQuery) {
        window.cefQuery({
            request: JSON.stringify({ url, action: "play"}),
            persistent: true,
            onSuccess: (response) => {
                console.log("success: " + response);
            },
            onFailure: (code, msg) => {
                console.log(`failure: ${code} ${msg}`);
            }
        });
    }
}

export function resume(url) {
    console.log(`-----------resume: playbackUrl = ${url}, window.cefQuery = ${window.cefQuery}`);
    if (url && window.cefQuery) {
        window.cefQuery({
            request: JSON.stringify({ url, action: "resume"}),
            persistent: true,
            onSuccess: (response) => {
                console.log(`success: ${response}`);
            },
            onFailure: (code, msg) => {
                console.log(`failure: ${code} ${msg}`);
            }
        });
    }
}

/** Reaching the function only in case of 401 unauthorized  **/
function forceTokenUpdate() {
    const FCID = Math.round(Math.random() * 10000) + "-" + getPlatformInfo().sessionInfo?.connectionId;
    console.log(`-----------forceTokenUpdate: window.cefQuery = ${window.cefQuery}, FCID = ${FCID}`);

    authToken = null;
    console.log(`-----------setToken: token= ${authToken}`);

    if (window.cefQuery) {
        window.cefQuery({
            request: JSON.stringify({ action: "authenticate", fcid: `${FCID}`}),
            persistent: false,
            onSuccess: (response) => {
                console.log("success: " + response);
            },
            onFailure: (code, msg) => {
                console.log(`failure: ${code} ${msg}`);
            }
        });
    } else {
        console.error(`window.cefQuery is undefined`);
    }
}

async function getToken() {

    console.log(`-----------getToken: `);

    if (!authToken) {
        console.log(`-----------getToken wait for promise updateSession event`);
        return new Promise((resolve) => {
            // Listen to updateSession event to set the new token
            document.addEventListener("updateSession", (e) => {
                authToken = e.detail?.updateObj;
                console.log(`-----------onUpdateSessionEvent: token= ${authToken}`);
                resolve(authToken);
            }, {once:true});
        });
    }
    console.log(`--------------getToken token = ${authToken}`);
    return Promise.resolve(authToken);

}

export const auth = {

    /** triggered upon '401' event */
    forceTokenUpdate,

    /** upon startups, make generic for 3d party, instead of current usage with diagnostics->session info it will simply call the getToken and will embed it in its future requests */
    getToken

};

export const player = {
    load,
    resume,
    play,
    get currentTime (){
        const playbackInfo = getPlaybackInfo();
        return playbackInfo?.playbackPosition;
    },
    set currentTime(playbackPosition) {
        setPlaybackInfo({playbackPosition});
    },
    get duration() {
        const playbackInfo = getPlaybackInfo();
        return playbackInfo?.assetDuration;
    }
};
