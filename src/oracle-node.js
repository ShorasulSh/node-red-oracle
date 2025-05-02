/**
 * oracle-node.js
 * Node-RED execution node for Oracle DB (Production Ready)
 */

const { getConnection, closePool } = require("./oracle-pool");
const { initThickClient } = require("./oracle-client");

module.exports = function (RED) {
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
                initThickClient(connConfig.instantClient, node);
            } catch (err) {
                node.error("Failed to initialize Oracle Thick Client: " + err.message);
                return;
            }
        }

        node.on("input", async function (msg, send, done) {
            send = send || node.send;
            let connection;

            try {
                connection = await getConnection(connConfig);

                const result = await connection.execute(
                    msg.topic,
                    msg.payload?.params || {},
                    msg.payload?.options || {}
                );
                // const result = await connection.execute(
                //     msg.topic,
                //     msg.payload?.params || {},
                //     {
                //         ...msg.payload?.options,
                //         outFormat: 4002, // OBJECT format
                //         fetchArraySize: 100,
                //         autoCommit: true
                //     }
                // );

                msg.payload = result.rows || result;
                send(msg);
                done();
            } catch (err) {
                node.error(`Oracle error: ${err.message}`, msg);
                done(err);
            } finally {
                if (connection) {
                    try {
                        await connection.close();
                    } catch (closeErr) {
                        node.warn("Failed to close Oracle connection: " + closeErr.message);
                    }
                }
            }
        });

        node.on("close", async function (removed, done) {
            try {
                await closePool();
                done();
            } catch (err) {
                node.warn("Oracle pool close error: " + err.message);
                done();
            }
        });
    }

    RED.nodes.registerType("asbt-oracle", OracleNode);
};