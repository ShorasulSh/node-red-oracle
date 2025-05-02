const oracledb = require("oracledb");

// Global pool reference
let pool;

async function initPool(config) {
    if (!pool) {
        try {
            pool = await oracledb.createPool({
                user: config.user,
                password: config.password,
                connectString: config.connectString,
                poolMin: 2,
                poolMax: 10,
                poolIncrement: 2,
                enableStatistics: false
            });
            console.log("✅ Oracle connection pool initialized");
        } catch (err) {
            console.error("❌ Failed to initialize Oracle pool:", err.message);
            throw err;
        }
    }
    return pool;
}

async function getConnection(config) {
    await initPool(config);
    return await pool.getConnection();
}

async function closePool() {
    if (pool) {
        try {
            await pool.close(10); // Wait up to 10 seconds
            console.log("✅ Oracle pool closed successfully");
        } catch (err) {
            console.warn("⚠️ Error closing Oracle pool:", err.message);
        } finally {
            pool = null;
        }
    }
}

module.exports = {
    getConnection,
    closePool
};