module.exports = function (RED) {
    const path = require("path");
    const oracledb = require("oracledb");

    function OracleConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.host = config.host;
        this.port = config.port;
        this.database = config.database;
        this.user = config.user;
        this.password = config.password;
        this.mode = config.mode;
        this.instantClient = config.instantClient;

        this.connectString = `${this.host}:${this.port}/${this.database}`;
    }

    RED.nodes.registerType("oracle-config", OracleConfigNode);

    function OracleNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const connConfig = RED.nodes.getNode(config.server);

        if (!connConfig) {
            node.error("Oracle config not found.");
            return;
        }

        if (connConfig.mode === "thick" && connConfig.instantClient) {
            try {
                const clientPath = path.resolve(connConfig.instantClient);
                oracledb.initOracleClient({ libDir: clientPath });
                node.log("Oracle Thick Client initialized from: " + clientPath);
            } catch (err) {
                node.error("OracleClient init failed: " + err.message);
                return;
            }
        }

        node.on("input", async function (msg, send, done) {
            send = send || node.send;

            const connectionDetails = {
                user: connConfig.user,
                password: connConfig.password,
                connectString: connConfig.connectString
            };

            let connection;
            try {
                connection = await oracledb.getConnection(connectionDetails);
                const result = await connection.execute(
                    msg.topic,
                    msg.payload?.params || {},
                    msg.payload?.options || {}
                );
                msg.payload = result.rows || result;
                send(msg);
                done();
            } catch (err) {
                node.error("Oracle error: " + err.message, msg);
                done(err);
            } finally {
                if (connection) {
                    try {
                        await connection.close();
                    } catch (closeErr) {
                        node.warn("Connection close failed: " + closeErr.message);
                    }
                }
            }
        });
    }

    RED.nodes.registerType("asbt-oracle", OracleNode);
};
