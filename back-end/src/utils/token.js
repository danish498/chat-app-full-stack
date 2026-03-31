import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      username: user.username 
    }, 
    config.jwt.accessSecret, 
    { expiresIn: config.jwt.accessExpiration }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id 
    }, 
    config.jwt.refreshSecret, 
    { expiresIn: config.jwt.refreshExpiration }
  );
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    return null;
  }
};
