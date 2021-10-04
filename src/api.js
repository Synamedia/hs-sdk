const communityManagerService = "hyperscale-community-manager:9092";

let cachedAppStorage;

async function loadAppStorageFromDb() {
    const {tenant, sessionInfo} = window.diagnostics ? window.diagnostics() : {};
    if (!tenant || !sessionInfo) {
        return;
    }
    const {deviceId} = JSON.parse(sessionInfo);
    if (!deviceId) {
        return;
    }
    try {
        const response = await fetch(`http://${communityManagerService}/devices/1.0/tenant/${tenant}/resourceId/${deviceId}`);
        const data = await response.json();
        cachedAppStorage = data?.appStorage;
    } catch (err) {
        console.log(err);
    }
}

export async function init() {
    console.log("hs-sdk init");
    await loadAppStorageFromDb();
}

export function diagnostic() {
    return {
        wifi: "",
        tenant: ""
    };
}

export function setSessionStorage(key, value) {
    window.hsStorageSetItem(key, value);
}

export function getSessionStorage(key) {
    return window.hsStorageGetItem(key);
}

export async function setPersistentStorage(key, value) {
    const {tenant, sessionInfo} = window.diagnostics ? window.diagnostics() : {};
    if (!tenant || !sessionInfo) {
        return;
    }
    const {deviceId} = JSON.parse(sessionInfo);
    if (!deviceId) {
        return;
    }
    try {
        const appStorage = {};
        appStorage[key] = value;
        const options = {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({appStorage})};
        const response = await fetch(`http://${communityManagerService}/devices/1.0/tenant/${tenant}/resourceId/${deviceId}`, options);
        if (response?.status === 200) {
            cachedAppStorage[key] = value;
        }
    } catch (err) {
        console.log(err);
    }
}

export function getPersistentStorage(key) {
    return cachedAppStorage ? cachedAppStorage[key] : undefined;
}
