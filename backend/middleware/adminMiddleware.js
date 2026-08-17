const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const adminProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, no token provided.',
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretjwtkey'
      );

      // Check user role from DB if connected, or from decoded payload
      const userId = decoded.id;
      let userRole = decoded.role || 'student';

      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
        const dbUser = await User.findById(userId);
        if (dbUser) {
          userRole = dbUser.role;
        }
      }

      // Allow admin or demo admin token
      if (userRole === 'admin' || userId === 'admin_user_id') {
        req.user = { id: userId, _id: userId, role: 'admin' };
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Lost & Found Team/Admin privileges required.',
        });
      }
    } catch (error) {
      console.error('Admin middleware error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token validation failed.',
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Not authorized, no token header.',
  });
};

module.exports = { adminProtect };
