// nodes/oracle-config/oracle-config.js
module.exports = function (RED) {
    const oracledb = require("oracledb");

    function OracleConfigNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.host = config.host;
        node.port = config.port;
        node.user = config.user;
        node.password = config.password;
        node.sid = config.sid;
        node.poolAlias = config.name || `oracle_${node.id}`;

        const connectString = `${node.host}:${node.port}/${node.sid}`;

        // Initialize connection pool
        oracledb.initOracleClient?.(); // Optional, in case InstantClient is prepackaged

        oracledb.createPool({
            user: node.user,
            password: node.password,
            connectString: connectString,
            poolAlias: node.poolAlias,
            poolMin: 1,
            poolMax: 4,
            poolIncrement: 1,
        }).then(pool => {
            node.pool = pool;
            node.log(`Oracle pool created for ${node.poolAlias}`);
        }).catch(err => {
            node.error(`Failed to create Oracle pool: ${err.message}`);
        });

        node.on("close", async function (done) {
            try {
                if (node.pool) {
                    await node.pool.close(10);
                    node.log(`Closed Oracle pool: ${node.poolAlias}`);
                }
                done();
            } catch (err) {
                node.error(`Error closing Oracle pool: ${err.message}`);
                done(err);
            }
        });
    }

    RED.nodes.registerType("oracle-config", OracleConfigNode);
};
