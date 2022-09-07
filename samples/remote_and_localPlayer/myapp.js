import { init, remotePlayer, uiReady, lifecycle } from "@Synamedia/hs-sdk";
import shaka from "shaka-player";

const TEST_VIDEO="https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd";

window.addEventListener("load", async () => {
    try {
        await init();
        const video = document.getElementById("video");
        window.localPlayer = new shaka.Player(video);
        await window.localPlayer.load(TEST_VIDEO);
        window.localPlayer.getMediaElement().play();
        uiReady();
    } catch (e) {
        console.error(e);
    }
});

let isRemotePlayerLoaded = false;
lifecycle.addEventListener("onstatechange", (e) => {
    console.info("onstatechange event, new state is", e.state);
    if (e.state === "background") {
        window.localPlayer.getMediaElement().pause();
    } else if (e.state === "foreground") {
        window.localPlayer.getMediaElement().play();
    }
});

remotePlayer.addEventListener("timeupdate",() => {
    console.info("timeupdate event, remote player current time is", remotePlayer.currentTime);
    window.localPlayer.getMediaElement().currentTime = remotePlayer.currentTime || 0;
});

remotePlayer.addEventListener("ended", () => {
    console.info("ended event, returning to ui");
    lifecycle.moveToForeground();
});

document.addEventListener("keydown", async (event) => {

    console.info("keydown event, event.key is", event.key);

    if (event.key !== "Enter" && event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        console.info("Ignoring key. Reacting only to Enter/ArrowLeft/ArrowRight");
        return;
    }

    const currentState = await lifecycle.getState();
    console.info("current state is", currentState);

    if (event.key === "ArrowLeft") {
        window.localPlayer.getMediaElement().currentTime = window.localPlayer.getMediaElement().currentTime - 30;
    } else if (event.key === "ArrowRight") {
        window.localPlayer.getMediaElement().currentTime = window.localPlayer.getMediaElement().currentTime + 30;
    }

    // If a key is pressed while remote player is playing, and the app wants to react to this key
    // and display ui, it needs to call the lifecycle api moveToForeground().
    // To identify this scenario we need to check the lifecycle state.
    // 'background' state means that remote player is playing.
    // 'inTransitionToBackground' state means that the app called remotePlayer.play() but the playback
    // hasn't started yet. This can happen if a key was pressed right after the call to remotePlayer.play()
    if (currentState === 'background' || currentState === 'inTransitionToBackground') {
        lifecycle.moveToForeground();
    } else {
        if (event.key === "Enter") { // we want to start remote playback
            const localPlayerCurrentTime = window.localPlayer.getMediaElement().currentTime;
            console.info("Setting remote player current time to", localPlayerCurrentTime);
            remotePlayer.currentTime = localPlayerCurrentTime;
            if (isRemotePlayerLoaded) {
                console.info("Calling play");
                remotePlayer.play();
                return;
            }
            console.info("Calling load & play");
            remotePlayer.load(TEST_VIDEO);
            remotePlayer.play();
            isRemotePlayerLoaded = true;
        }
    }
}, false);
