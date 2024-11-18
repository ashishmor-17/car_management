
const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }],
  tags: {
    car_type: { type: String },
    company: { type: String },
    dealer: { type: String }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, { timestamps: true });

carSchema.index({ title: 'text', description: 'text', 'tags.car_type': 'text', 'tags.company': 'text', 'tags.dealer': 'text' });

module.exports = mongoose.model('Car', carSchema);
