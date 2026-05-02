const mongoose = require('mongoose');

const offerBannerSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  subText: {
    type: String,
    default: ''
  },
  bgColor: {
    type: String,
    default: '#f97316'
  },
  textColor: {
    type: String,
    default: '#ffffff'
  },
  emoji: {
    type: String,
    default: '🎉'
  },
  image: {
    type: String,
    default: ''   // optional banner image path
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('OfferBanner', offerBannerSchema);
