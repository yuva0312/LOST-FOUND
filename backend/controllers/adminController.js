const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Match = require('../models/Match');
const Claim = require('../models/Claim');
const { createNotificationHelper } = require('./notificationController');

const isDbConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

// Generate JWT Token including role
const generateAdminToken = (id) => {
  return jwt.sign(
    { id, role: 'admin' },
    process.env.JWT_SECRET || 'supersecretjwtkey',
    { expiresIn: '30d' }
  );
};

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both Admin ID/Email and password.',
      });
    }

    const cleanId = identifier.toLowerCase().trim();

    // Default emergency fallback credentials for testing / dev mode
    if (cleanId === 'admin@campus.edu' && password === 'admin123') {
      const token = generateAdminToken('admin_user_id');
      return res.status(200).json({
        success: true,
        message: 'Admin login successful!',
        token,
        user: {
          id: 'admin_user_id',
          fullName: 'Lost & Found Team Admin',
          email: 'admin@campus.edu',
          role: 'admin',
        },
      });
    }

    if (isDbConnected()) {
      const user = await User.findOne({
        $or: [{ email: cleanId }, { studentId: identifier.trim() }],
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials.',
        });
      }

      if (user.role !== 'admin' && user.role !== 'staff') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Account does not have admin permissions.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials.',
        });
      }

      const token = generateAdminToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'Admin login successful!',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials. Use admin@campus.edu / admin123 in dev mode.',
      });
    }
  } catch (error) {
    console.error('Admin Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin login.',
    });
  }
};

// @desc    Get Admin Dashboard Stats Metrics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    let totalLostReports = 0;
    let totalFoundReports = 0;
    let potentialMatches = 0;
    let pendingClaims = 0;
    let approvedClaims = 0;
    let rejectedClaims = 0;
    let returnedItems = 0;

    if (isDbConnected()) {
      totalLostReports = await LostItem.countDocuments();
      totalFoundReports = await FoundItem.countDocuments();
      potentialMatches = await Match.countDocuments();

      pendingClaims = await Claim.countDocuments({ status: 'pending' });
      approvedClaims = await Claim.countDocuments({ status: 'approved' });
      rejectedClaims = await Claim.countDocuments({ status: 'rejected' });
      returnedItems = await FoundItem.countDocuments({
        status: { $in: ['claimed', 'returned'] },
      });
    } else {
      // Dev mode fallback mock counters
      totalLostReports = 12;
      totalFoundReports = 15;
      potentialMatches = 8;
      pendingClaims = 3;
      approvedClaims = 5;
      rejectedClaims = 2;
      returnedItems = 4;
    }

    return res.status(200).json({
      success: true,
      data: {
        totalLostReports,
        totalFoundReports,
        potentialMatches,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        returnedItems,
      },
    });
  } catch (error) {
    console.error('Get Admin Dashboard Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard metrics.',
    });
  }
};

// @desc    Get All Claims for Admin Review
// @route   GET /api/admin/claims
// @access  Private/Admin
const getAllClaims = async (req, res) => {
  try {
    if (isDbConnected()) {
      const claims = await Claim.find()
        .populate('studentId', 'fullName email phone department year studentId')
        .populate('lostItemId')
        .populate('foundItemId')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: claims.length,
        data: claims,
      });
    } else {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }
  } catch (error) {
    console.error('Get All Claims Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving claims.',
    });
  }
};

// @desc    Approve a Claim
// @route   PUT /api/admin/claims/:id/approve
// @access  Private/Admin
const approveClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id || req.user._id;

    if (isDbConnected()) {
      const claim = await Claim.findById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim request not found.',
        });
      }

      claim.status = 'approved';
      claim.reviewedBy = adminId;
      claim.reviewedAt = new Date();
      await claim.save();

      // Update FoundItem status to 'claimed'
      if (claim.foundItemId) {
        await FoundItem.findByIdAndUpdate(claim.foundItemId, { status: 'claimed' });
      }

      // Update LostItem status to 'recovered'
      if (claim.lostItemId) {
        await LostItem.findByIdAndUpdate(claim.lostItemId, { status: 'recovered' });
      }

      // Dispatch Claim Approved Notification to student
      await createNotificationHelper({
        userId: claim.studentId,
        title: 'Claim Approved',
        message: 'Your claim has been approved. Contact the Lost & Found Team to collect your item.',
        type: 'claim_approved',
        relatedClaimId: claim._id,
        relatedItemId: claim.foundItemId,
      });

      return res.status(200).json({
        success: true,
        message: 'Claim successfully approved! Student notification sent.',
        data: claim,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Claim successfully approved (Dev mode).',
      });
    }
  } catch (error) {
    console.error('Approve Claim Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error approving claim.',
    });
  }
};

// @desc    Reject a Claim
// @route   PUT /api/admin/claims/:id/reject
// @access  Private/Admin
const rejectClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id || req.user._id;

    if (isDbConnected()) {
      const claim = await Claim.findById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim request not found.',
        });
      }

      claim.status = 'rejected';
      claim.reviewedBy = adminId;
      claim.reviewedAt = new Date();
      await claim.save();

      // Keep found item available ('reported')
      if (claim.foundItemId) {
        await FoundItem.findByIdAndUpdate(claim.foundItemId, { status: 'reported' });
      }

      // Dispatch Claim Rejected Notification to student
      await createNotificationHelper({
        userId: claim.studentId,
        title: 'Claim Status Update',
        message: 'Your claim could not be verified.',
        type: 'claim_rejected',
        relatedClaimId: claim._id,
        relatedItemId: claim.foundItemId,
      });

      return res.status(200).json({
        success: true,
        message: 'Claim rejected. Found item kept available for future matches.',
        data: claim,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Claim rejected (Dev mode).',
      });
    }
  } catch (error) {
    console.error('Reject Claim Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error rejecting claim.',
    });
  }
};

// @desc    Request More Verification Info for a Claim
// @route   PUT /api/admin/claims/:id/request-info
// @access  Private/Admin
const requestMoreVerification = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const claim = await Claim.findById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim request not found.',
        });
      }

      claim.status = 'under_review';
      await claim.save();

      await createNotificationHelper({
        userId: claim.studentId,
        title: 'Verification Details Requested',
        message: 'The Lost & Found Team requested additional details for your claim.',
        type: 'claim_submitted',
        relatedClaimId: claim._id,
      });

      return res.status(200).json({
        success: true,
        message: 'Claim status updated to Under Review.',
        data: claim,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Claim status updated to Under Review (Dev mode).',
      });
    }
  } catch (error) {
    console.error('Request Info Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating claim status.',
    });
  }
};

// @desc    Get All Lost Items for Admin
// @route   GET /api/admin/lost-items
// @access  Private/Admin
const getAllLostItems = async (req, res) => {
  try {
    if (isDbConnected()) {
      const items = await LostItem.find()
        .populate('userId', 'fullName email phone department year')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    } else {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }
  } catch (error) {
    console.error('Get All Lost Items Admin Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving lost items.',
    });
  }
};

// @desc    Get All Found Items for Admin Inspection (Unredacted)
// @route   GET /api/admin/found-items
// @access  Private/Admin
const getAllFoundItems = async (req, res) => {
  try {
    if (isDbConnected()) {
      const items = await FoundItem.find()
        .populate('reportedBy', 'fullName email phone department year')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    } else {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }
  } catch (error) {
    console.error('Get All Found Items Admin Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving found items.',
    });
  }
};

// @desc    Get All Matches for Admin
// @route   GET /api/admin/matches
// @access  Private/Admin
const getAllMatches = async (req, res) => {
  try {
    if (isDbConnected()) {
      const matches = await Match.find()
        .populate('lostItemId')
        .populate('foundItemId')
        .sort({ matchScore: -1 });

      return res.status(200).json({
        success: true,
        count: matches.length,
        data: matches,
      });
    } else {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }
  } catch (error) {
    console.error('Get All Matches Admin Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving matches.',
    });
  }
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllClaims,
  approveClaim,
  rejectClaim,
  requestMoreVerification,
  getAllLostItems,
  getAllFoundItems,
  getAllMatches,
};
