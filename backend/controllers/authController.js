const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// In-memory fallback user store when MongoDB is not yet connected (dev mode)
const inMemoryUsers = [];

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey', {
    expiresIn: '30d',
  });
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { fullName, studentId, email, phone, department, year, password } = req.body;

    // 1. Validation: Check required fields
    if (!fullName || !studentId || !email || !phone || !department || !year || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.',
      });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid college email address.',
      });
    }

    // Check if Mongoose DB connection is ready (readyState === 1)
    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    if (isDbConnected) {
      // 2. Check if studentId already exists in MongoDB
      const existingStudentId = await User.findOne({ studentId: studentId.trim() });
      if (existingStudentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID / Register number is already registered.',
        });
      }

      // 3. Check if email already exists in MongoDB
      const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'College email address is already registered.',
        });
      }

      // 4. Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 5. Create and save user
      const user = await User.create({
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        department: department.trim(),
        year: year.trim(),
        password: hashedPassword,
        role: 'student',
      });

      // 6. Return response without password
      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        user: {
          id: user._id,
          fullName: user.fullName,
          studentId: user.studentId,
          email: user.email,
          phone: user.phone,
          department: user.department,
          year: user.year,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } else {
      // Development mode fallback when MongoDB URI is placeholder
      const existingStudentId = inMemoryUsers.find(
        (u) => u.studentId.toLowerCase() === studentId.trim().toLowerCase()
      );
      if (existingStudentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID / Register number is already registered.',
        });
      }

      const existingEmail = inMemoryUsers.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'College email address is already registered.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        id: Date.now().toString(),
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        department: department.trim(),
        year: year.trim(),
        password: hashedPassword,
        role: 'student',
        createdAt: new Date(),
      };

      inMemoryUsers.push(newUser);

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          studentId: newUser.studentId,
          email: newUser.email,
          phone: newUser.phone,
          department: newUser.department,
          year: newUser.year,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration. Please try again.',
    });
  }
};

// @desc    Authenticate student & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both Student ID/Email and password.',
      });
    }

    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    if (isDbConnected) {
      // Find user by either email or studentId
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase().trim() },
          { studentId: identifier.trim() }
        ]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. User not found.',
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Incorrect password.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful!',
        token: generateToken(user._id),
        user: {
          id: user._id,
          fullName: user.fullName,
          studentId: user.studentId,
          email: user.email,
          phone: user.phone,
          department: user.department,
          year: user.year,
          role: user.role,
        },
      });
    } else {
      // In-memory lookup fallback
      const user = inMemoryUsers.find(
        (u) =>
          u.email.toLowerCase() === identifier.toLowerCase().trim() ||
          u.studentId.toLowerCase() === identifier.trim().toLowerCase()
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. User not found.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Incorrect password.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful!',
        token: generateToken(user.id),
        user: {
          id: user.id,
          fullName: user.fullName,
          studentId: user.studentId,
          email: user.email,
          phone: user.phone,
          department: user.department,
          year: user.year,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login. Please try again.',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};

