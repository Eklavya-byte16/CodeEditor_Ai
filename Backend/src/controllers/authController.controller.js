import User from "../modules/user.modules.js";
import Token from "../modules/token.js";

import {
  signAccessTocken,
  signRefrashToken,
  varifyAccestoken,
  varifyRefreshTocken,
  setTokenCookie,
  clearTokenCookies,
  getTokenExpiryMs,
} from "./jwt.controller.js";

import {
  hashPassword,
  comparePassword,
  validatePasswordStrenth,
  sanitizePassword,
} from "./bcrypt.controller.js";

import {
  ValidationError,
  AuthenticationError,
  AccountLockedError,
  ConflictError,
  NotFoundError,
  InvalidTokenError,
  DatabaseError,
  handleMongoError,
  InternalServerError,
} from "../utils/Errors.js";

export const signup = async (req, res, next) => { 
  // validate user
  // check if already exists
  // hash password
  // create user in mongoDB
  // generate token
  // store Refresh token
  // set httpCookies
  // Return user info

  try {
    const { email, password, username } = req.body;
    if (!email) {
      throw new ValidationError("email required", "email");
    }
    if (!password) {
      throw new ValidationError("password required", "password");
    }
    if (!username) {
      throw new ValidationError("username required", "username");
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("invalid Format", "email");
    }

    const passwordValidation = validatePasswordStrenth(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.errors[0]);
    }

    const cleanPassword = password.trim(); 

    const existingEmail = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingEmail) {
      throw new ConflictError(
        "Email already registered, login with another email",
        "email",
      );
    }

    const existingUsername = await User.findOne({
      username: username.trim()
    });

    if (existingUsername) {
      throw new ConflictError(
        "Username already taken, please choose another",
        "username"
      );
    }

    const hashedPassword = await hashPassword(cleanPassword); 
    
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      username: username.trim(),
      emailVerified: false, 
      isActive: true,
      photo: { url: null },
    });

    try {
      await newUser.save();
    } catch (mongoError) {
      throw handleMongoError(mongoError);
    }

    const accessToken = signAccessTocken(
      newUser._id.toString(),
      newUser.username,
      newUser.email,
    );
    const refreshtoken = signRefrashToken(newUser._id.toString(), 0);
    const refreshExpiryMs = getTokenExpiryMs("7d");
    const tokenExpiryDate = new Date(Date.now() + refreshExpiryMs);

    try {
      const tokenRecord = new Token({
        userId: newUser._id,
        refreshToken: refreshtoken,
        tokenVersion: 0,
        expiresAt: tokenExpiryDate,
        userAgent: req.get("User-Agent"),
        ipAddress: req.ip,
      });
      await tokenRecord.save();
    } catch (mongoError) {
      throw new DatabaseError("Failed to Save Refresh Token", 500, mongoError);
    }

    setTokenCookie(res, "accessToken", accessToken, getTokenExpiryMs("15m"));
    setTokenCookie(res, "refreshToken", refreshtoken, refreshExpiryMs);
    
    // FIX 6: Reference the actual newUser object to return the registration details
    res.status(201).json({
      success: true,
      user: {
        userId: newUser._id,
        email: newUser.email,
        username: newUser.username,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
   next(error);
  }
};

export const login = async (req, res, next) => {
  // validate input
  // find user via email
  // cheack if account is AccountLocked
  // comparePassword
  // if wrong password
  // right password
  // store in clearTokenCookies
  // set cookes
  // return user info

  try {
    const { email, password } = req.body;

    if (!email) {
      throw new ValidationError("Email required", "email");
    }
    if (!password) {
      throw new ValidationError("password required", "password");
    }

    const user = await User.findByEmail(email).select("+password");
    if (!user) {
      throw new AuthenticationError("Invalid Email or password");
    }
    if (user.isLocked) {
      const minutesLeft = Math.ceil(
        (user.loginBlockedTill - Date.now()) / 60000,
      );
      throw new AccountLockedError(
        `account is locked due to too many requestes, try again in ${minutesLeft} min`,
        user.loginBlockedTill,
      );
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      try {
        await user.increaseLoginAttempts();
      } catch (error) {
        console.error("Faild to increment the attemptes", error);
      }
      throw new AuthenticationError("invalid Email or password");
    }

    try {
      await user.resetLoginAttempts();
    } catch (error) {
      console.error("Faild to reset the login Attempts", error);
    }

    const accessToken = signAccessTocken(user._id.toString(), user.email);
    const refreshToken = signRefrashToken(
      user._id.toString(),
      user.tokenVersion || 0,
    );

    const refreshExpiryMs = getTokenExpiryMs("7d");
    const tokenExpiryDate = new Date(Date.now() + refreshExpiryMs);

    try {
      const tokenRecord = new Token({
        userId: user._id,
        refreshToken: refreshToken,
        tokenVersion: user.tokenVersion || 0,
        expiresAt: tokenExpiryDate,
        userAgent: req.get("User-Agent"),
        ipAddress: req.ip,
      });
      await tokenRecord.save();
    } catch (mongoError) {
      throw new DatabaseError("Failed to store refresh Token", 500, mongoError);
    }

    setTokenCookie(res, "accessToken", accessToken, getTokenExpiryMs("15m"));
    setTokenCookie(res, "refreshToken", refreshToken, refreshExpiryMs);

    res.status(200).json({
      success: true,
      message: "logged in successfully",
      user: {
        userId: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  // getdecoded ref token
  // find token in db
  // verify token
  // genrate new access token
  // set in httpOnly cookes
  // return success
  try {
    const { userId, tokenVersion: tokenVersionInJWT } = req.refreshTokenData;
    const tokenRecord = await Token.findValidToken(req.refreshToken);

    if (!tokenRecord) {
      clearTokenCookies(res);
      throw new InvalidTokenError(
        "Refresh token is no longer valid. plz login again",
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("user not found", "user");
    }

    if (!user.isActive) {
      throw new AuthenticationError("Account is Inaction");
    }

    const userTokenVersion = user.tokenVersion || 0;
    if (tokenVersionInJWT !== userTokenVersion) {
      try {
        await Token.revokeUserTokens(userId);
      } catch {
        console.error("failed to revoke user token", error);
      }
      clearTokenCookies(res);
      throw new InvalidTokenError(" your password was changed. login again");
    }

    const newAccseeToken = signAccessTocken(user._id.toString(), user.email);
    setTokenCookie(res, "accessToken", newAccseeToken, getTokenExpiryMs("15m"));

    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const logOut = async (req, res, next) => {
  // get ref token
  // find and delet token from db
  // clear both cookies
  // return success

  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const tokenRecord = await Token.findOne({
          refreshToken: refreshToken,
        });
        if (tokenRecord) {
          await tokenRecord.revoke();
        }
      } catch (error) {
        console.error("Faild to revoket token", error);
      }
    }

    clearTokenCookies(res);
    res.status(200).json({
      success: true,
      message: "logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  // called on loadding page to varify the user is logged in return uer info for fronend management

  try {
    if (!req.user) {
      throw new AuthenticationError("User is not Authenticcated");
    }
    const user = await User.findById(req.user.userId);
    if (!user || !user.isActive) {
      throw new NotFoundError("User not found", "user");
    }

    res.status(200).json({
      success: true,
      user: {
        userId: user._id,
        email: user.email,
        username: user.username,
        photo: user.photo,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAllDivices = async (req, res, next) => {
  // user changes password
  // user suspects account breach
  // User wnats to logout from all divices
  try {
    if (!req.user) {
      throw new DatabaseError("failed to revoke token", 500);
    }
    try {
      await Token.revokeUserTokens(req.user.userId);
    } catch (error) {
      throw new DatabaseError("failed to revoke token", 500, error);
    }

    clearTokenCookies(res);
    res.status(200).json({
      success: true,
      message: "logged out From all divices",
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      throw new ValidationError("access_token is required", "access_token");
    }

    // Verify the token by asking Google who it belongs to
    const googleRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
    );

    if (!googleRes.ok) {
      throw new AuthenticationError("Invalid or expired Google token");
    }

    const googlePayload = await googleRes.json();
    const { sub: googleId, email, name, picture, email_verified } = googlePayload;

    if (!email || !email_verified) {
      throw new AuthenticationError("Google account email not verified");
    }

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (!user) {
      // New user — create one, no password needed
      user = new User({
        email: email.toLowerCase(),
        username: name?.replace(/\s+/g, "").toLowerCase() || `user_${googleId.slice(0, 8)}`,
        googleId,
        authProvider: "google",
        emailVerified: true,
        isActive: true,
        photo: { url: picture || null },
      });
      await user.save();
    } else if (!user.googleId) {
      // Existing local account, same email — link Google to it
      user.googleId = googleId;
      await user.save();
    }

    const accessToken = signAccessTocken(user._id.toString(), user.email);
    const refreshtoken = signRefrashToken(user._id.toString(), user.tokenVersion || 0);
    const refreshExpiryMs = getTokenExpiryMs("7d");

    await new Token({
      userId: user._id,
      refreshToken: refreshtoken,
      tokenVersion: user.tokenVersion || 0,
      expiresAt: new Date(Date.now() + refreshExpiryMs),
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    }).save();

    setTokenCookie(res, "accessToken", accessToken, getTokenExpiryMs("15m"));
    setTokenCookie(res, "refreshToken", refreshtoken, refreshExpiryMs);

    res.status(200).json({
      success: true,
      user: { userId: user._id, email: user.email, username: user.username },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  signup,
  login,
  refreshToken,
  logOut,
  getCurrentUser,
  logoutAllDivices,
  googleAuth
};
