import express from 'express';
import {
    signup,
    login,
    logOut,
    refreshToken,
    getCurrentUser,
    logoutAllDivices
} from '../controllers/authController.controller.js';

import {
    authenticate,
    validateRefreshToken
} from '../middlewares/authenticate.js';


import {
    loginRateLimit,
    signUpRateLimit,
    refreshRateLimit
} from '../middlewares/rateLimit.js';

import {asyncHandler} from '../middlewares/errorHandler.js';

import { googleAuth } from '../controllers/authController.controller.js';

const router = express.Router();

router.post(
    '/signup',
    signUpRateLimit,
    asyncHandler(signup)
);

router.post(
    '/login',
    loginRateLimit,
    asyncHandler(login)
);
router.post(
    '/refresh-token',
    validateRefreshToken,
    refreshRateLimit,
    asyncHandler(refreshToken)
);
router.post(
    '/logout',
    asyncHandler(logOut)
);
router.get(
    '/me',
    authenticate,
    asyncHandler(getCurrentUser)
);
router.post(
    '/logout-all',
    authenticate,
    asyncHandler(logoutAllDivices)
);

router.post(
    '/google',
    loginRateLimit,
    asyncHandler(googleAuth)
);

export default router