const oracledb = require("oracledb");
const path = require("path");

let initialized = false;

function initThickClient(libDir, logger = console) {
    if (initialized) return;

    try {
        const resolvedPath = path.resolve(libDir);
        oracledb.initOracleClient({ libDir: resolvedPath });
        logger.log("✅ Oracle Thick Client initialized at:", resolvedPath);
        initialized = true;
    } catch (err) {
        logger.error("❌ Failed to initialize Thick Client:", err.message);
        throw err;
    }
}

module.exports = {
    initThickClient
};
