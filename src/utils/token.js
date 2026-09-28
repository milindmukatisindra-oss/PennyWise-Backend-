import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const JWT_EXPIRES_IN = '7d';

/**
 * Generates a signed JWT token for the authenticated user.
 * @param {object} payload - Typically { id, email, name }
 * @returns {string} Signed JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verifies a JWT token.
 * @param {string} token 
 * @returns {object} Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};
