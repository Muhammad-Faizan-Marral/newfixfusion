// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { createUser, getUserByEmail, updateUserOTP, verifyUserOTP } = require('../models/userModel');

// Nodemailer config
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"FixFusion" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for FixFusion Signup',
    html: `<h3>OTP: ${otp}</h3><p>This code is valid for 10 minutes.</p>`
  });
};

const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await getUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = await createUser({ name, email, password: hashedPassword, role, otp, otp_expires_at });

    await sendOTPEmail(email, otp);

    res.status(201).json({ message: 'Signup successful. OTP sent to your email.' });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.is_verified) return res.status(200).json({ message: 'Already verified.' });

    if (user.otp !== otp || new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: 'OTP is invalid or expired.' });
    }

    await verifyUserOTP(email);
    res.status(200).json({ message: 'Email verified successfully. Please login now.' });

  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email before login.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Incorrect password.' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.status(200).json({ message: 'Login successful.', token,user, });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { signup, verifyOTP, login };
