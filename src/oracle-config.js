module.exports = function (RED) {
    function OracleConfigNode(config) {
        RED.nodes.createNode(this, config);

        // Basic connection parameters
        this.host = config.host;
        this.port = config.port;
        this.database = config.database;
        this.user = config.user;
        this.password = config.password;

        // Connection mode
        this.mode = config.mode || "thin";
        this.instantClient = config.instantClient;

        // Build a single connection string (host:port/serviceName)
        this.connectString = `${this.host}:${this.port}/${this.database}`;
    }

    RED.nodes.registerType("oracle-config", OracleConfigNode);
};