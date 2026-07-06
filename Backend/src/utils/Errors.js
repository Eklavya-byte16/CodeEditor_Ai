import mongoose, { MongooseError } from "mongoose";

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.name = "ValidationError";
    this.field = field;

    Object.defineProperty(this, "statusCode", {
      value: 400,
      writable: true,
      enumerable: true,
    });
    Object.defineProperty(this, "isOperational", {
      value: true,
      writable: true,
      enumerable: true,
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "invalid Email or password") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

export class InvalidTokenError extends AppError {
  constructor(message = "invalid or malformed token") {
    super(message, 401);
    this.name = "InvalidTokenError";
  }
}
export class TokenExpiredError extends AppError {
  constructor(message = "Access token is expired", tokenType = "access") {
    super(message, 401);
    this.name = "TokenExpiredError";
    this.tokenType = tokenType;

    Object.defineProperty(this, "tokenType", {
      enumerable: true,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message, resource = null) {
    super(message, 409);
    this.name = "ConflictError";
    this.resource = resource;

    Object.defineProperty(this, "resource", {
      enumerable: true,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "resource not found", resource = null) {
    super(message, 404);
    this.name = "NotFoundError";
    this.resource = resource;

    Object.defineProperty(this, "resource", {
      enumerable: true,
    });
  }
}

export class RatelimitError extends AppError {
  constructor(message = "too many requests", retryAfter = 900) {
    super(message, 429);
    this.name = "RatelimitError";
    this.retryAfter = retryAfter;

    Object.defineProperty(this, "retryAfter", {
      enumerable: true,
    });
  }
}

export class AccountLockedError extends AppError {
  constructor(
    message = "Account is temporarily locked due to failed login",
    unlockAt = null,
  ) {
    super(message, 423);
    this.name = "AccountLockedError";
    this.unlockAt = unlockAt;

    Object.defineProperty(this, "unlockAt", {
      enumerable: true,
    });
  }
}

export class DatabaseError extends AppError {
  // 💡 Add statusCode as a parameter (defaulting to 500)
  constructor(
    message = "Database operation failed",
    statusCode = 500,
    originalError = null,
  ) {
    // Forward it cleanly to AppError's constructor
    super(message, statusCode);

    this.name = "DatabaseError";
    this.originalError = originalError;

    if (process.env.NODE_ENV === "development") {
      this.details = originalError?.message;
    }
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal Server Error", originalError = null) {
    super(message, 500);
    this.name = "InternalServerError";
    this.originalError = originalError;

    if (process.env.NODE_ENV === "development") {
      this.details = originalError?.message;
      this.stack = originalError?.stack;
    }
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized token provided") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export const handleMongoError = (error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    //  Pass 409 as the second argument (the statusCode parameter)
    return new DatabaseError(`${field} already exists.`, 409, error);
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((el) => el.message);
    //  Pass 400 as the second argument
    return new DatabaseError(
      `Invalid input data: ${messages.join(", ")}`,
      400,
      error,
    );
  }

  return new DatabaseError(error.message, 500, error);
};

export default {
  AppError,
  ValidationError,
  TokenExpiredError,
  AuthenticationError,
  InvalidTokenError,
  ConflictError,
  NotFoundError,
  RatelimitError,
  AccountLockedError,
  DatabaseError,
  InternalServerError,
  UnauthorizedError,
  ForbiddenError,
  handleMongoError,
};
