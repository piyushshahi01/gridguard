import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  notes: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now }
});

const caseSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  transformer: { type: String, required: true },
  location: { type: String, required: true },
  anomalyType: { type: String, required: true }, // 'sudden_drop', 'mismatch', 'flatline', 'spike', 'night_time', 'drift'
  severity: { type: String, required: true }, // 'warning', 'critical'
  riskScore: { type: Number, required: true },
  explanation: { type: String, required: true },
  
  actionStatus: { 
    type: String, 
    enum: ['open', 'assigned', 'checked', 'confirmed', 'false_alarm'], 
    default: 'open' 
  },
  assignedTo: { type: String, default: 'Unassigned' },
  notes: { type: String, default: "" },
  history: [statusHistorySchema]
}, { timestamps: true });

export default mongoose.models.Case || mongoose.model('Case', caseSchema);
