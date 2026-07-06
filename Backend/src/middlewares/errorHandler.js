import {
  AppError,
  ValidationError,
  DatabaseError,
  InternalServerError,
} from "../utils/Errors.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof AppError)) {
    error = new InternalServerError("An unexpected error occurred", err);
  }
  logError(error, req);
  const response = buildErrorResponse(error, req);
  res.status(error.statusCode).json(response);
};

const logError = (error, req) => {
  const logData = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId || "anonymous",
  };

  if (process.env.NODE_ENV === "development") {
    logData.stack = error.stack;
    if (error.originalError) {
      logData.originalError = error.originalError.message;
      logData.originalStack = error.originalError.stack;
    }
    console.error("[ERROR]", JSON.stringify(logData, null, 2));
  } else {
    console.error("[ERROR]", JSON.stringify(logData));
  }
};

export const buildErrorResponse = (error, req) => {
  const response = {
    success: false,
    error: {
      message: error.message,
      statusCode: error.statusCode,
      type: error.name,
    },
  };

  if (error instanceof ValidationError && error.field) {
    response.error.field = error.field;
  }
  if (error.resource) {
    response.error.resource = error.resource;
  }
  if (error.tokenType) {
    response.error.tokenType = error.tokenType;
  }
  if (error.retryAfter) {
    response.error.retryAfter = error.retryAfter;
  }
  if (error.unlocksAt) {
    response.error.unlocksAt = error.unlocksAt;
  }
  if (process.env.NODE_ENV === "development") {
    response.error.details = error.details;
  }

  return response;
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `route not found ${req.method} ${req.originalUrl}`,
      statusCode: 404,
      type: "NotFoundError",
    },
  });
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const formatValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    const formatted = {};
    errors.forEach((err) => {
      formatted[err.param] = err.msg;
    });
    return formatted;
  }
  return errors;
};

export const getSafeErrorMessage = (error) => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (process.env.NODE_ENV === "production") {
    return "An error occurred. Please try again later.";
  }
  return error.message;
};

export const handleMongoError = (error) => {
  console.error(error);
};

export default {
  errorHandler,
  buildErrorResponse,
  notFoundHandler,
  asyncHandler,
  formatValidationErrors,
  getSafeErrorMessage,
  handleMongoError,
};