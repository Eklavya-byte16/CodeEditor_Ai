import express from 'express';
import { googleSignIn } from '../controllers/authController.js';

const router = express.Router();

router.post('/google', googleSignIn);

export default router;
