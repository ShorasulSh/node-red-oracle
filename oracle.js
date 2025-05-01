const oracledb = require("oracledb");

module.exports = function (RED) {
    function AsbtOracleNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on("input", async function (msg, send, done) {
            try {
                const connection = await oracledb.getConnection({
                    user: config.user,
                    password: config.password,
                    connectString: config.connectString
                });

                const result = await connection.execute(msg.payload.query);
                msg.payload = result.rows;
                await connection.close();

                send(msg);
                done();
            } catch (err) {
                node.error("Oracle DB error: " + err.message, msg);
                done(err);
            }
        });
    }

    RED.nodes.registerType("asbt-oracle", AsbtOracleNode);
};
