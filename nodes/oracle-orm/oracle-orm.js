module.exports = function (RED) {
    const oracledb = require("oracledb");

    function OracleQueryNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.oracleConfig = RED.nodes.getNode(config.oracle);
        node.query = config.query;

        node.on("input", async function (msg, send, done) {
            if (!node.oracleConfig || !node.oracleConfig.poolAlias) {
                node.error("Oracle config is missing or invalid");
                return done();
            }

            try {
                const connection = await oracledb.getConnection(node.oracleConfig.poolAlias);
                const binds = msg.params || {};

                const result = await connection.execute(node.query, binds, {
                    outFormat: oracledb.OUT_FORMAT_OBJECT
                });

                msg.payload = result.rows;
                send(msg);
                connection.close();
                done();
            } catch (err) {
                node.error("Oracle query failed: " + err.message, msg);
                done(err);
            }
        });
    }

    RED.nodes.registerType("oracle-orm", OracleQueryNode);
};
