const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const upload = require('../middleware/upload');
const { sendVerificationEmail, testEmailConfig } = require('../config/email');

// Test email configuration endpoint
router.get('/test-email', async (req, res) => {
  try {
    const isValid = await testEmailConfig();
    res.json({ 
      success: isValid, 
      message: isValid ? 'Email configuration is valid' : 'Email configuration failed' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error testing email configuration', 
      error: error.message 
    });
  }
});

// Submit verification document
router.post('/submit', upload.single('verificationDocument'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No verification document uploaded' 
      });
    }

    // Get user details from request body
    const userDetails = {
      name: req.body.name || 'Unknown User',
      email: req.body.email || 'No email provided',
      userId: req.body.userId || 'No ID provided',
    };

    console.log('📄 Processing verification submission:');
    console.log('- File:', req.file.filename);
    console.log('- User:', userDetails.name);
    console.log('- Email:', userDetails.email);

    // Send email to admin
    const emailResult = await sendVerificationEmail(
      userDetails,
      req.file.path,
      req.file.originalname
    );

    // Optional: Delete file after sending email (uncomment if you don't want to keep files)
    // setTimeout(() => {
    //   fs.remove(req.file.path).catch(console.error);
    // }, 60000); // Delete after 1 minute

    res.json({
      success: true,
      message: 'Verification document submitted successfully',
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        submissionTime: new Date().toISOString(),
        emailSent: emailResult.success,
        messageId: emailResult.messageId
      }
    });

  } catch (error) {
    console.error('❌ Error in verification submission:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.remove(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit verification document',
      error: error.message
    });
  }
});

// Get verification status (placeholder for future implementation)
router.get('/status/:userId', (req, res) => {
  // This endpoint can be used later to check verification status
  const { userId } = req.params;
  
  res.json({
    success: true,
    message: 'Status check endpoint - to be implemented',
    userId: userId,
    status: 'pending' // pending, approved, rejected
  });
});

module.exports = router;