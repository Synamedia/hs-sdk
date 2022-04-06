const sessionInfo = require("./mockResponses/sessionInfo.json");
const diagnostics = require("./mockResponses/diagnostics.json");
const {init} = require("../src/api");

exports.initSdkMock = async function (windowSpy) {
    windowSpy.mockImplementation(() => ({
        cefQuery: function (params) {
            console.info(params.request);
            if (params.request === "sessionInfo") {
                return params.onSuccess(JSON.stringify(sessionInfo));
            }
        },
        diagnostics: function () {
            return JSON.parse(JSON.stringify(diagnostics));
        }
    }));

    await init();
};
