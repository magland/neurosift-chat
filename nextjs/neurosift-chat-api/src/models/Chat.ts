import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  userName: { type: String, required: false },
  promptTokens: { type: Number, required: true },
  completionTokens: { type: Number, required: true },
  estimatedCost: { type: Number, required: true },
  messageMetadata: [{
    model: { type: String, required: true },
    timestamp: { type: Number, required: true },
    feedback: { type: String, enum: ['up', 'down', null], default: null }
  }],
  messages: { type: [mongoose.Schema.Types.Mixed], required: false },
  timestampCreated: { type: Number, required: true },
  timestampUpdated: { type: Number, required: true }
});

export const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
