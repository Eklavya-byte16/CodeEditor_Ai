// signAccessTocken && RefreshToken
// varify both
// decode
// extract token from cookie
// set cookie
// clear cookie
// get token expiry in ms

import jwt from 'jsonwebtoken';

const getAccessSecret = () =>
  process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESSTOCKEN_SECRET;

const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESTOCKEN_SECRET;

const getAccessExpiry = () =>
  process.env.JWT_ACCESS_EXPIREY || process.env.ACCESSTOCKEN_DURETION || "15m";

const getRefreshExpiry = () =>
  process.env.JWT_REFRESH_EXPIRY || process.env.REFRESTOCKEN_DURETION || "7d";

export const signAccessTocken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: "access",
  };

  const option = {
    expiresIn: getAccessExpiry().toLowerCase(),
    issuer: "Ekalvya",
    audience: "User",
  };

  try {
    const token = jwt.sign(payload, getAccessSecret(), option);
    return token;
  } catch (error) {
    throw new Error(`Failed to get Token wil error: ${error.message}`);
  }
};

export const signRefrashToken = (userId, tokenVersion) => {
  const payload = {
    userId,
    tokenVersion,
    type: "refresh",
  };

  const option = {
    expiresIn: getRefreshExpiry().toLowerCase(),
    issuer: "Ekalvya",
    audience: "User",
  };
  try {
    const token = jwt.sign(payload, getRefreshSecret(), option);
    return token;
  } catch (error) {
    throw new Error(`Failed to load sign refrash token: ${error.message}`);
  }
};

export const varifyAccestoken = (token) => {
  try {
    const decoded = jwt.verify(token, getAccessSecret(), {
      issuer: "Ekalvya",
      audience: "User",
    });
    if (decoded.type !== "access") {
      throw new Error("invalid tocken");
    }
    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Access tocken expired");
    }
    throw new Error(`The varifyAccestoken says: ${error.message}`);
  }
};

export const varifyRefreshTocken = (token) => {
  try {
    const decoded = jwt.verify(token, getRefreshSecret(), {
      issuer: "Ekalvya",
      audience: "User",
    });

    if (decoded.type !== "refresh") {
      throw new Error("invalid Refresh tocken");
    }
    return decoded;
  } catch (error) {
    throw new Error(`The varifyRefreshTocken says: ${error.message}`);
  }
};

export const decodeTocken = (token) => {
  try {
    const decoded = jwt.decode(token, { complete: false });
    return decoded;
  } catch (error) {
    throw new Error("Failed to decode token");
  }
};

export const extractTokenfromCookie = (req, tokenName) => {
  try {
    const token = req.cookies?.[tokenName];

    if (!token) {
      throw new Error(`${tokenName} not Found in cookies`);
    }
    return token;
  } catch (error) {
    throw new Error("extractTokenfromCookie:", error.message);
  }
};

export const setTokenCookie = (res, tokenName, token, expiresInMs) => {
  res.cookie(tokenName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: expiresInMs,
    path: "/",
  });
};

export const clearTokenCookies = (res) => {
  res.cookie("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
};

export const getTokenExpiryMs = (expiryString) => {
  " Convert my string time to the real numbered time";
  const match = expiryString.toLowerCase().match(/^(\d+)([mhd])$/);

  if (!match) {
    throw new Error("invalid expiry format. use 15m , 1h, 7d ");
  }
  const [, value, unit] = match;
  const num = parseInt(value, 10);
  const unitMs = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return num * unitMs[unit];
};

export default {
  signAccessTocken,
  signRefrashToken,
  getTokenExpiryMs,
  clearTokenCookies,
  setTokenCookie,
  extractTokenfromCookie,
  decodeTocken,
  varifyRefreshTocken,
  varifyAccestoken,
};
