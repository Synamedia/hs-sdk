// import {auth, getPlatformInfo} from "../src/api";
import {initSdkMock} from "./testUtils";
// const sessionInfo = require("./mockResponses/sessionInfo.json");

let windowSpy;
beforeAll(async () => {
    windowSpy = jest.spyOn(window, "window", "get");
    await initSdkMock(windowSpy);
});

afterAll(() => {
    windowSpy.mockRestore();
});

xtest("Test set URL", async () => {
    console.info("Test set URL");
});
