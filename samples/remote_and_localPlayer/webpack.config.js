const path = require("path");

module.exports = {
    entry: ["./myapp.js"],
    mode: "development",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js"
    }
};
