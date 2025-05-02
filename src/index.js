module.exports = function (RED) {
    require("./oracle-config")(RED);
    require("./oracle-node")(RED);
};