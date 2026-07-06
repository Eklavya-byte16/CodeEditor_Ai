import jwt from 'jsonwebtoken';
import User from '../models/User.js'; 
import { verifyGoogleToken } from '../config/googleAuth.js';

export const googleSignIn = async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  const payload = await verifyGoogleToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Invalid Google token' });
  }

  const { email, name, picture } = payload;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, avatar: picture });
    }

    const sessionToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.status(200).json({ user, token: sessionToken });
  } catch (error) {
    res.status(500).json({ message: 'Server error during authentication' });
  }
};
