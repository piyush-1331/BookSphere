/**
 * 404 Route Not Found Middleware
 */
const notFoundHandler = (req, res, _next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist on this server.`,
    },
  });
};

module.exports = notFoundHandler;
