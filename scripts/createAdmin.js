/**
 * Script to create admin user
 * Email: pradipakkar557@gmail.com
 * Password: pradip25082008
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdmin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/akkar-store');
    console.log('Connected to MongoDB');

    // Delete existing admin if exists
    await User.deleteOne({ email: 'pradipakkar557@gmail.com' });
    console.log('Cleared existing admin user');

    // Create new admin user (password will be hashed by pre-save hook)
    const admin = new User({
      name: 'Admin',
      email: 'pradipakkar557@gmail.com',
      password: 'pradip25082008',
      isAdmin: true
    });

    await admin.save();
    console.log('✓ Admin user created successfully!');
    console.log('Email: pradipakkar557@gmail.com');
    console.log('Password: pradip25082008');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

createAdmin();
