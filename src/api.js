let authToken;
let sessionInfo = "{}";

/** @namespace auth
 *@example
 * import { auth } from "@ip-synamedia/hs-sdk";
 **/
export const auth = {

    /** Should be called upon '401' event (unauthorized) */
    forceTokenUpdate,

    /** Should be called upon startup and be embedded in future requests */
    getToken

};

/** Should be called once to init the library
 *@example
 * import { init } from '@ip-synamedia/hs-sdk';
 * await init()
 **/
export async function init() {
    console.log("hs-sdk init");

    if (window.cefQuery) {
        sessionInfo = await new Promise((resolve) => {
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
        });

        console.log(`-----------sessionInfo: sessionInfo= ${sessionInfo}`);
        const sessionInfoObj = JSON.parse(sessionInfo);
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

    // Adding auth to window for testing purpose which allows us to use and test auth APIs in pipeline tests
    window.auth = auth;
}

/** Returns the platform information, such as device id, tenant, community, settings etc. */
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
            version: "X.X.XX-X",
            pod: "ui-streamer-X.X.XX-X-QWERT-ASDFG-XXX-XXXXXX-XXXXX",
            podIP: "0.0.0.0",
            sessionInfo: {
                userAgent: "SynamediaHyperscale/XX.YY.ZZ",
                connectionId: "dummy",
                deviceId: "123456789",
                community: "LocalDev",
                appConnectionId: "dummy_a~App",
                tenant: "XXXXXX",
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
        console.error("window.cefQuery is undefined");
    }
}

async function getToken() {
    if (!authToken) {
        console.log("-----------getToken wait for promise updateSession event");
        return new Promise((resolve) => {
            // Listen to updateSession event to set the new token
            document.addEventListener("updateSession", (e) => {
                authToken = e.detail?.updateObj;
                console.log(`-----------onUpdateSessionEvent: token= ${authToken}`);
                resolve(authToken);
            }, {once:true});
        });
    }
    return Promise.resolve(authToken);
}

/** Returns a boolean that indicates whether we are running in an e2e environment, or on local browser */
export function isRunningE2E() {
    return !!(typeof window !== "undefined" && window.cefQuery);
}

export const remotePlayer = require("./remotePlayer");

/** Hyperscale proxy for Shaka player. Once created it should be used as a regular Shaka player.
 * Pay attention that autoplay is NOT supported.
 *@example
 * import { HsShakaPlayer } from '@ip-synamedia/hs-sdk';
 * const shakaPlayerInstance = new shaka.Player(videoElement);
 * const player = new HsShakaPlayer(shakaPlayerInstance);
 * player.load(url);
 * player.play();
 * player.unload();
 * **/
export const HsShakaPlayer = require("./hsShakaPlayer");
