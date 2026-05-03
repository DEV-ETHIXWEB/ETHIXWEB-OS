/**
 * Consistent response envelope: { success, data, message }
 */
function ok(res, data, message = 'OK', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function fail(res, message = 'Error', status = 400, extra) {
  return res.status(status).json({
    success: false,
    error: message,   // backwards-compatible field used by frontend
    message,
    ...(extra ? { details: extra } : {}),
  });
}

class ApiError extends Error {
  constructor(message, status = 400, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = { ok, fail, ApiError };
