export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  console.error(err); // keep the stack in terminal logs

  return res.status(status).json({ success: false, message });
}
