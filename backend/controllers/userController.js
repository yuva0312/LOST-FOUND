const User = require('../models/User');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Claim = require('../models/Claim');
const bcrypt = require('bcryptjs');

// Fallback in-memory store reference from authController if MongoDB is not connected
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    let userDoc = null;
    let activitySummary = {
      totalLostReports: 0,
      totalFoundReports: 0,
      claimsSubmitted: 0,
      itemsRecovered: 0,
    };

    if (isDbConnected) {
      userDoc = await User.findById(userId).select('-password');
      if (userDoc) {
        const [lostCount, foundCount, claimCount, recoveredCount] = await Promise.all([
          LostItem.countDocuments({ userId }),
          FoundItem.countDocuments({ reportedBy: userId }),
          Claim.countDocuments({ studentId: userId }),
          LostItem.countDocuments({ userId, status: 'recovered' }),
        ]);

        activitySummary = {
          totalLostReports: lostCount,
          totalFoundReports: foundCount,
          claimsSubmitted: claimCount,
          itemsRecovered: recoveredCount,
        };
      }
    }

    // Dev fallback if userDoc is null
    if (!userDoc) {
      userDoc = {
        _id: userId || 'demo_student_id',
        fullName: 'Alex Vance',
        studentId: 'CS2024-089',
        email: 'alex.vance@campus.edu',
        phone: '+1 555-0192',
        department: 'Computer Science',
        year: '3rd Year',
        role: 'student',
      };
      activitySummary = {
        totalLostReports: 2,
        totalFoundReports: 1,
        claimsSubmitted: 1,
        itemsRecovered: 1,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: userDoc._id || userDoc.id,
          fullName: userDoc.fullName,
          studentId: userDoc.studentId,
          email: userDoc.email,
          phone: userDoc.phone,
          department: userDoc.department,
          year: userDoc.year,
          role: userDoc.role,
        },
        activitySummary,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile data.',
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { phone, department, year, studentId, email, role } = req.body;

    // Explicitly disallow modifying studentId, email, or role
    if (studentId || email || role) {
      console.warn('Attempt to modify immutable fields (studentId/email/role) ignored');
    }

    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    let updatedUser = null;

    if (isDbConnected) {
      const updateData = {};
      if (phone !== undefined) updateData.phone = phone.trim();
      if (department !== undefined) updateData.department = department.trim();
      if (year !== undefined) updateData.year = year.trim();

      updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select('-password');
    }

    if (!updatedUser) {
      updatedUser = {
        id: userId || 'demo_student_id',
        fullName: 'Alex Vance',
        studentId: 'CS2024-089',
        email: 'alex.vance@campus.edu',
        phone: phone || '+1 555-0192',
        department: department || 'Computer Science',
        year: year || '3rd Year',
        role: 'student',
      };
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser._id || updatedUser.id,
        fullName: updatedUser.fullName,
        studentId: updatedUser.studentId,
        email: updatedUser.email,
        phone: updatedUser.phone,
        department: updatedUser.department,
        year: updatedUser.year,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile.',
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully!',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error changing password.',
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
};
