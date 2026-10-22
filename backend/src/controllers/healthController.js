const { getDBStatus } = require('../config/db');

/**
 * Health check controller
 * GET /api/health & GET /health
 *
 * Reports:
 * - Express status & uptime
 * - MongoDB connection status & readiness
 */
const getHealth = async (req, res, next) => {
  try {
    const dbStatus = await getDBStatus();
    const isDbHealthy = dbStatus.readyState === 1;

    const response = {
      success: true,
      service: 'BookSphere Backend API',
      status: isDbHealthy ? 'healthy' : 'degraded',
      express: {
        status: 'healthy',
        uptimeSeconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
      },
      mongodb: {
        status: dbStatus.status,
        connected: isDbHealthy,
        readyState: dbStatus.readyState,
        databaseName: dbStatus.databaseName,
        pingMs: dbStatus.pingMs,
      },
      timestamp: new Date().toISOString(),
      data: {
        service: 'BookSphere Backend API',
        status: isDbHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus,
      },
    };

    const httpStatus = isDbHealthy ? 200 : 503;
    res.status(httpStatus).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
};
