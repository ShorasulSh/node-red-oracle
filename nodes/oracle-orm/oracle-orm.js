// nodes/oracle-orm/oracle-orm.js
module.exports = function (RED) {
    const oracledb = require("oracledb");

    function OracleOrmNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.configNode = RED.nodes.getNode(config.oracle);
        node.modelNode = RED.nodes.getNode(config.model);
        node.operation = config.operation;

        if (!node.configNode || !node.modelNode) {
            node.error("Missing oracle-config or oracle-model reference");
            return;
        }

        const schema = node.modelNode.getSchema();
        const poolAlias = node.configNode.poolAlias;

        node.on("input", async function (msg, send, done) {
            try {
                const connection = await oracledb.getConnection(poolAlias);
                let result;

                if (node.operation === "select") {
                    // Simple SELECT with optional filters
                    const where = msg.payload?.where || "1=1";
                    const sql = `SELECT * FROM ${schema.table} WHERE ${where}`;
                    result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

                } else if (node.operation === "insert") {
                    const payload = msg.payload;
                    const fields = schema.columns.map(col => col.name);
                    const values = fields.map(f => payload[f]);
                    const placeholders = fields.map(() => `:`).join(", ");
                    const sql = `INSERT INTO ${schema.table} (${fields.join(", ")}) VALUES (${placeholders})`;
                    result = await connection.execute(sql, values, { autoCommit: true });

                } else if (node.operation === "update") {
                    const payload = msg.payload;
                    const pk = schema.primaryKey;
                    const updates = schema.columns.map(col => `${col.name} = :${col.name}`);
                    const sql = `UPDATE ${schema.table} SET ${updates.join(", ")} WHERE ${pk} = :pk`;
                    const binds = Object.assign({}, payload, { pk: payload[pk] });
                    result = await connection.execute(sql, binds, { autoCommit: true });

                } else if (node.operation === "delete") {
                    const pk = schema.primaryKey;
                    const sql = `DELETE FROM ${schema.table} WHERE ${pk} = :pk`;
                    result = await connection.execute(sql, { pk: msg.payload[pk] }, { autoCommit: true });
                }

                msg.payload = result.rows || result;
                send(msg);
                done();
            } catch (err) {
                node.error("Oracle ORM error: " + err.message, msg);
                done(err);
            }
        });
    }

    RED.nodes.registerType("oracle-orm", OracleOrmNode);
};
