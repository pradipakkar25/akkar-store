require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

// Sample products data - using uploaded images
const sampleProducts = [
  {
    name: 'Premium Coffee Beans',
    price: 450,
    description: 'High-quality arabica coffee beans sourced from premium estates. Perfect for espresso and filter coffee.',
    category: 'Groceries',
    image: '/uploads/coffee.svg',
    stock: 50
  },
  {
    name: 'Organic Tea Collection',
    price: 320,
    description: 'Assorted organic tea collection including green, black, and herbal teas. 100% natural ingredients.',
    category: 'Groceries',
    image: '/uploads/tea.svg',
    stock: 75
  },
  {
    name: 'Whole Wheat Flour',
    price: 180,
    description: 'Premium whole wheat flour milled from finest wheat grains. Rich in fiber and nutrients.',
    category: 'Groceries',
    image: '/uploads/flour.svg',
    stock: 100
  },
  {
    name: 'Organic Honey',
    price: 520,
    description: 'Pure organic honey collected from local beekeepers. No additives or preservatives.',
    category: 'Groceries',
    image: '/uploads/honey.svg',
    stock: 40
  },
  {
    name: 'Spice Mix Pack',
    price: 280,
    description: 'Assorted spice mix including turmeric, cumin, coriander, and more. Freshly ground.',
    category: 'Groceries',
    image: '/uploads/spices.svg',
    stock: 60
  },
  {
    name: 'Basmati Rice (5kg)',
    price: 650,
    description: 'Premium long-grain basmati rice. Perfect for biryani and pulao. 5kg pack.',
    category: 'Groceries',
    image: '/uploads/rice.svg',
    stock: 80
  },
  {
    name: 'Bangles Set - Gold',
    price: 420,
    description: 'Beautiful traditional gold-plated bangles set. Perfect for festivals and special occasions.',
    category: 'Bangles',
    image: '/uploads/bangles-gold.svg',
    stock: 45
  },
  {
    name: 'Bangles Set - Silver',
    price: 380,
    description: 'Elegant silver-plated bangles set. Versatile for everyday wear and celebrations.',
    category: 'Bangles',
    image: '/uploads/bangles-silver.svg',
    stock: 55
  },
  {
    name: 'Lipstick - Red',
    price: 240,
    description: 'Premium long-lasting lipstick in vibrant red. Smooth application and rich color.',
    category: 'Beauty Products',
    image: '/uploads/lipstick.svg',
    stock: 70
  },
  {
    name: 'Face Cream - Moisturizer',
    price: 350,
    description: 'Hydrating face cream with natural ingredients. Suitable for all skin types.',
    category: 'Beauty Products',
    image: '/uploads/cream.svg',
    stock: 120
  }
];

// Connect to MongoDB and seed data
async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      name: 'Admin',
      email: 'pradipakkar557@gmail.com',
      password: 'pradip25082008', // Will be hashed automatically
      isAdmin: true
    });

    await adminUser.save();
    console.log('Admin user created:', adminUser.email);
    console.log('Admin password:', 'pradip25082008');

    // Create sample user
    const sampleUser = new User({
      name: 'John Doe',
      email: 'user@example.com',
      password: 'user123', // Will be hashed automatically
      isAdmin: false
    });

    await sampleUser.save();
    console.log('Sample user created:', sampleUser.email);

    // Insert sample products
    const insertedProducts = await Product.insertMany(sampleProducts);
    console.log(`${insertedProducts.length} products inserted successfully`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nAdmin Credentials:');
    console.log('Email: admin@akkarstore.com');
    console.log('Password: admin123');
    console.log('\nSample User Credentials:');
    console.log('Email: user@example.com');
    console.log('Password: user123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
