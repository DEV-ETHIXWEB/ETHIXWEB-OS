const mongoose = require('mongoose');
const { ALL_PERMISSION_KEYS } = require('../config/permissions');

const RoleSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    key: { type: String, required: true, trim: true, lowercase: true }, // e.g. 'hr' (system) or 'regional-sales-lead' (custom)
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    description: { type: String, default: '', maxlength: 300 },
    isSystem: { type: Boolean, default: false }, // one of the 10 built-in roles — not deletable
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((p) => ALL_PERMISSION_KEYS.includes(p)),
        message: 'Unknown permission key',
      },
    },
  },
  { timestamps: true }
);

RoleSchema.index({ organization: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Role', RoleSchema);
