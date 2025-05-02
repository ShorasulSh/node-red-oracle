// module.exports = function (RED) {
//     const oracledb = require("oracledb");
//     const path = require("path");
//
//     let initialized = false;
//
//     function initThickClient(libDir, logger = console) {
//         if (initialized) return;
//
//         try {
//             const resolvedPath = path.resolve(libDir);
//             oracledb.initOracleClient({libDir: resolvedPath});
//             logger.log("✅ Oracle Thick Client initialized at:", resolvedPath);
//             initialized = true;
//         } catch (err) {
//             logger.error("❌ Failed to initialize Thick Client:", err.message);
//             throw err;
//         }
//     }
//
//
//     function OracleConfigNode(config) {
//         RED.nodes.createNode(this, config);
//
//         // Basic connection parameters
//         this.host = config.host;
//         this.port = config.port;
//         this.database = config.database;
//         this.user = config.user;
//         this.password = config.password;
//
//         // Connection mode
//         this.mode = config.mode || "thin";
//         this.instantClient = config.instantClient;
//
//         // Build a single connection string (host:port/serviceName)
//         this.connectString = `${this.host}:${this.port}/${this.database}`;
//     }
//
//     RED.nodes.registerType("oracle-config", OracleConfigNode);
//
//
//     function OracleNode(config) {
//         RED.nodes.createNode(this, config);
//         const node = this;
//
//         const connConfig = RED.nodes.getNode(config.server);
//
//         if (!connConfig) {
//             node.error("Oracle config not found.");
//             return;
//         }
//
//         if (connConfig.mode === "thick" && connConfig.instantClient) {
//             try {
//                 initThickClient(connConfig.instantClient, node);
//             } catch (err) {
//                 node.error("Failed to initialize Oracle Thick Client: " + err.message);
//                 return;
//             }
//         }
//
//         node.on("input", async function (msg, send, done) {
//             send = send || node.send;
//             let connection;
//
//             try {
//                 connection = await getConnection(connConfig);
//
//                 const result = await connection.execute(
//                     msg.topic,
//                     msg.payload?.params || {},
//                     {
//                         ...msg.payload?.options,
//                         outFormat: 4002, // OBJECT format
//                         fetchArraySize: 100,
//                         autoCommit: true
//                     }
//                 );
//
//                 msg.payload = result.rows || result;
//                 send(msg);
//                 done();
//             } catch (err) {
//                 node.error(`Oracle error: ${err.message}`, msg);
//                 done(err);
//             } finally {
//                 if (connection) {
//                     try {
//                         await connection.close();
//                     } catch (closeErr) {
//                         node.warn("Failed to close Oracle connection: " + closeErr.message);
//                     }
//                 }
//             }
//         });
//
//         node.on("close", async function (removed, done) {
//             try {
//                 await closePool();
//                 done();
//             } catch (err) {
//                 node.warn("Oracle pool close error: " + err.message);
//                 done();
//             }
//         });
//     }
//
//     RED.nodes.registerType("asbt-oracle", OracleNode);
//
//
//     let pool;
//
//     async function initPool(config) {
//         if (!pool) {
//             try {
//                 pool = await oracledb.createPool({
//                     user: config.user,
//                     password: config.password,
//                     connectString: config.connectString,
//                     poolMin: 2,
//                     poolMax: 10,
//                     poolIncrement: 2,
//                     enableStatistics: false
//                 });
//                 console.log("✅ Oracle connection pool initialized");
//             } catch (err) {
//                 console.error("❌ Failed to initialize Oracle pool:", err.message);
//                 throw err;
//             }
//         }
//         return pool;
//     }
//
//     async function getConnection(config) {
//         await initPool(config);
//         return await pool.getConnection();
//     }
//
//     async function closePool() {
//         if (pool) {
//             try {
//                 await pool.close(10); // Wait up to 10 seconds
//                 console.log("✅ Oracle pool closed successfully");
//             } catch (err) {
//                 console.warn("⚠️ Error closing Oracle pool:", err.message);
//             } finally {
//                 pool = null;
//             }
//         }
//     }
//
// };