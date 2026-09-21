import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "model"],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  products: {
    type: Array,
    default: []
  },
  sources: {
    type: Array,
    default: []
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  guestId: {
    type: String,
    index: true
  },
  messages: [chatMessageSchema],
  activeFilters: {
    brand: String,
    minPrice: Number,
    maxPrice: Number,
    ram: String,
    need: String
  },
  lastSuggestedProducts: [
    {
      id: String,
      slug: String,
      title: String,
      brand: String,
      priceVnd: Number,
      productUrl: String,
      specs: Object
    }
  ],
  isProcessing: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: { expires: 0 } // MongoDB TTL deletes doc when expiresAt <= current time
  }
}, {
  timestamps: true
});

export default mongoose.model("ChatSession", chatSessionSchema);
