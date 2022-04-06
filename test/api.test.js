import {getPlatformInfo} from "../src/api";
import {initSdkMock} from "./testUtils";
const diagnostics = require("./mockResponses/diagnostics.json");
const sessionInfo = require("./mockResponses/sessionInfo.json");
let windowSpy;

beforeAll(async () => {
    windowSpy = jest.spyOn(window, "window", "get");

    await initSdkMock(windowSpy);
});

afterAll(() => {
    windowSpy.mockRestore();
});

test("getPlatfromInfo", async () => {
    const platfromInfo = getPlatformInfo();
    const expected = diagnostics;
    expected.sessionInfo = sessionInfo;

    expect(platfromInfo).toEqual(expected);
});
