// nodes/oracle-model/oracle-model.js
module.exports = function (RED) {
    function OracleModelNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.name = config.name;
        node.table = config.table;
        node.primaryKey = config.primaryKey;
        node.columns = config.columns || [];

        // Provide a method to expose this schema
        node.getSchema = function () {
            return {
                table: node.table,
                primaryKey: node.primaryKey,
                columns: node.columns,
            };
        };
    }

    RED.nodes.registerType("oracle-model", OracleModelNode);
};
