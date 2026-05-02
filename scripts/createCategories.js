require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

async function createCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/akkar-general-store');
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Create sample categories
    const categories = [
      { name: 'Groceries', icon: '🛒', description: 'Daily grocery items' },
      { name: 'Bangles', icon: '💍', description: 'Traditional jewelry' },
      { name: 'Beauty Products', icon: '💄', description: 'Cosmetics and beauty items' }
    ];

    const insertedCategories = await Category.insertMany(categories);
    console.log(`${insertedCategories.length} categories inserted successfully`);

    console.log('Categories created:');
    insertedCategories.forEach(cat => {
      console.log(`- ${cat.icon} ${cat.name}: ${cat.description}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating categories:', error);
    process.exit(1);
  }
}

createCategories();