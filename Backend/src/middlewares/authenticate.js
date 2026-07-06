import {
  extractTokenfromCookie,
  varifyAccestoken,
} from "../controllers/jwt.controller.js";

import {
  UnauthorizedError,
  TokenExpiredError,
  InvalidTokenError,
} from "../utils/Errors.js";

export const authenticate = async (req, res, next) => {
  try {
    let token;
    try {
      token = extractTokenfromCookie(req, "accessToken");
    } catch (error) {
      throw new UnauthorizedError("No authization token found. please login.");
    }

    let decoded;
    try {
      decoded = varifyAccestoken(token);
    } catch (error) {
      if (error.message === "Access token expired") {
        throw new InvalidTokenError("Token is Invalid or tampered with.");
      }

      throw new InvalidTokenError(error.message);
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    if (process.env.NODE_ENV === "development") {
      console.log(`[Auth] user ${req.user.userId} authenticated`);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    try {
      token = extractTokenfromCookie(req, "accessToken");
    } catch (error) {
      req.user = null;
      return next();
    }

    try {
      const decoded = varifyAccestoken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      req.user = null;
      return next();
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export const validateRefreshToken = async (req, res, next) => {
  try {
    let token;

    try {
      token = extractTokenfromCookie(req, "refreshToken");
    } catch (error) {
      throw new UnauthorizedError("No refreshToken found. plz login");
    }

    const { varifyRefreshTocken } =
      await import("../controllers/jwt.controller.js");
    let decoded;

    try {
      decoded = varifyRefreshTocken(token);
    } catch (error) {
      if (error.message === "Refresh token expired") {
        throw new TokenExpiredError(
          "refreshToken expired. plz login again",
          "refresh",
        );
      }
      throw new InvalidTokenError("Refresh token is Invalid. plz login again");
    }

    req.refreshToken = token;
    req.refreshTokenData = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (req, res, next) => {
  return (req, res, next) => {
    if ((!req, user)) {
      return next(new UnauthorizedError("User not authenticated"));
    }

    next();
  };
};

export default {
  authorize,
  validateRefreshToken,
  optionalAuth,
  authenticate,
};
