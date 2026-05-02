const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Function to create a simple PNG image using canvas-like approach
// We'll create simple colored rectangles as placeholder images
function createColoredImage(filename, color, text) {
  // Create a simple SVG and convert to PNG-like data
  // For now, we'll use a data URI approach
  const svg = `
    <svg width="250" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="250" height="200" fill="${color}"/>
      <text x="125" y="100" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${text}</text>
    </svg>
  `;
  
  // Save as SVG file (browsers can display SVG as images)
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`✅ Created: ${filename}`);
}

// Create sample product images
const products = [
  { filename: 'coffee.svg', color: '#8B4513', text: 'Coffee Beans' },
  { filename: 'tea.svg', color: '#90EE90', text: 'Tea Collection' },
  { filename: 'flour.svg', color: '#D2B48C', text: 'Wheat Flour' },
  { filename: 'honey.svg', color: '#FFD700', text: 'Honey' },
  { filename: 'spices.svg', color: '#CD853F', text: 'Spice Mix' },
  { filename: 'rice.svg', color: '#F5DEB3', text: 'Basmati Rice' },
  { filename: 'bangles-gold.svg', color: '#FFD700', text: 'Gold Bangles' },
  { filename: 'bangles-silver.svg', color: '#C0C0C0', text: 'Silver Bangles' },
  { filename: 'lipstick.svg', color: '#FFB6C1', text: 'Lipstick Red' },
  { filename: 'cream.svg', color: '#FFF0F5', text: 'Face Cream' }
];

console.log('Creating sample product images...\n');
products.forEach(product => {
  createColoredImage(product.filename, product.color, product.text);
});

console.log('\n✅ All sample images created successfully!');
console.log(`📁 Location: ${uploadsDir}`);
