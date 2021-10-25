const communityManagerService = "hyperscale-community-manager:9092";

let cachedAppStorage;
let tenant;
let deviceId;
let playbackPosition;

async function loadAppStorageFromDb() {
    const {sessionInfo:sessionInfoStr} = diagnostics() || {};
    if (!sessionInfoStr) {
        console.error("cannot load appStorage from DB, sessionInfo information is missing");
        return;
    }
    let sessionInfo;
    try {
        sessionInfo = JSON.parse(sessionInfoStr);
    } catch (err) {
        console.error("cannot load appStorage from DB, failed to parse sessionInfo");
        return;
    }
    tenant = sessionInfo.tenant;
    deviceId = sessionInfo.deviceId;
    if (!tenant || !deviceId) {
        console.error("cannot load appStorage from DB, either tenant or deviceId information is missing");
        return;
    }
    try {
        const response = await fetch(`http://${communityManagerService}/devices/1.0/tenant/${tenant}/resourceId/${deviceId}`);
        const data = await response.json();
        cachedAppStorage = data?.appStorage;
    } catch (err) {
        console.error(err);
    }
}

export function init() {
    console.log("hs-sdk init");
    return loadAppStorageFromDb();
}

export function diagnostics() {
    return typeof window !== "undefined" && window.diagnostics ? window.diagnostics() : undefined;
}

export function setSessionStorage(key, value) {
    window.hsStorageSetItem(key, value);
}

export function getSessionStorage(key) {
    return window.hsStorageGetItem(key);
}

export function clearSessionStorage() {
    return window.hsStorageSetItem("state", "{}");
}

export async function setPersistentStorage(key, value) {
    if (!cachedAppStorage) {
        console.error(`failed to set ${key}, appStorage was not loaded from DB`);
        return;
    }
    try {
        const appStorage = {[key]: value};
        const options = {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({appStorage})};
        const response = await fetch(`http://${communityManagerService}/devices/1.0/tenant/${tenant}/resourceId/${deviceId}`, options);
        if (response?.status === 200) {
            cachedAppStorage[key] = value;
        }
    } catch (err) {
        console.error(err);
    }
}

export function getPersistentStorage(key) {
    if (!cachedAppStorage) {
        console.error(`failed to get ${key}, appStorage was not loaded from DB`);
    }
    return cachedAppStorage?.[key];
}

export class Player {

    play(url) {
        this.url = url;
        playbackPosition = window.playbackPosition || 0.0;
        console.log(`-----------play: playbackUrl = ${this.url}, window.cefQuery = ${window.cefQuery}, playbackPosition = ${playbackPosition}`);
        if (this.url && window.cefQuery) {
            window.cefQuery({
                request: JSON.stringify({ url: this.url, action: "play", playbackPosition}),
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

    resume() {
        console.log(`-----------resume: playbackUrl = ${this.url}, window.cefQuery = ${window.cefQuery}, playbackPosition = ${playbackPosition}`);
        if (this.url && window.cefQuery) {
            window.cefQuery({
                request: JSON.stringify({ url: this.url, action: "resume", playbackPosition}),
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
}
