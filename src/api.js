export function init() {
    console.log("hs-sdk init");
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

export function setPersistentStorage(key, value) {

}

export function getPersistentStorage(key) {

}
