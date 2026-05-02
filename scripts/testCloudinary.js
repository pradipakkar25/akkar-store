require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('Testing Cloudinary Configuration...\n');

const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'NOT SET'
};

console.log('Configuration:');
console.log('- Cloud Name:', config.cloud_name || 'NOT SET');
console.log('- API Key:', config.api_key || 'NOT SET');
console.log('- API Secret:', config.api_secret);

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('\n❌ ERROR: Cloudinary credentials are incomplete!');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test the connection
cloudinary.api.resources({ max_results: 1 }, (error, result) => {
  if (error) {
    console.error('\n❌ Cloudinary Connection Failed:');
    console.error(error.message);
    process.exit(1);
  }
  
  console.log('\n✅ Cloudinary Connection Successful!');
  console.log('Account is properly configured and ready for uploads.');
  process.exit(0);
});
