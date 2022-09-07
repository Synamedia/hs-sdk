import { init, remotePlayer, uiReady, lifecycle, getDeviceInfo} from "@Synamedia/hs-sdk";

const TEST_VIDEO="https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd";

window.addEventListener("load", async (event) => {
    await init();
    document.getElementById("tenantId").innerText=getDeviceInfo().tenant;
    document.getElementById("deviceId").innerText=getDeviceInfo().deviceId;
    document.getElementById("communityId").innerText=getDeviceInfo().community;
    uiReady();
});

document.addEventListener("keydown", async (event) => {
    console.info(event);
    const currentState = await lifecycle.getState();
    console.info("current state is", currentState);
    if (currentState === 'background' || currentState === 'inTransitionToBackground') {
        console.info("Calling unload");
        remotePlayer.unload();
        lifecycle.moveToForeground();
    } else {
        console.info("Calling load & play");
        remotePlayer.load(TEST_VIDEO);
        remotePlayer.play();
    }
}, false);
