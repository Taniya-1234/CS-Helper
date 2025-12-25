const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    unique: true
  },

  subject: {
    type: String,
    required: true
  },

  responses: {
    direct: {
      type: String,
      default: null
    },
    concept: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: null
    }
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Question", questionSchema);
