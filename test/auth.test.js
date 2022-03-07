import {auth} from "../src/api";
import {initSdkMock} from "./testUtils";
const sessionInfo = require("./mockResponses/sessionInfo.json");

let windowSpy;
beforeAll(async () => {
    windowSpy = jest.spyOn(window, "window", "get");
    await initSdkMock(windowSpy);
});

afterAll(() => {
    windowSpy.mockRestore();
});

test("forceTokenUpdate", async () => {
    windowSpy.mockImplementation(() => ({
        cefQuery: function (params) {
            expect(JSON.parse(params.request).action).toEqual("authenticate");
        }
    }));

    const old = await auth.getToken();
    expect(old).toEqual(sessionInfo.settings?.webUI?.backendHeaders?.Authorization);
    auth.forceTokenUpdate();
    setTimeout(()=>{
        document.dispatchEvent(new CustomEvent("updateSession", { "detail":{updateObj:"NEWAUTH"} }));
    },500);

    const newToken = await auth.getToken();
    expect(newToken).toEqual("NEWAUTH");
});
