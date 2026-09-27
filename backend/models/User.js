const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = [
  'super_admin',
  'org_admin',
  'event_manager',
  'volunteer',
  'judge',
  'sponsor_viewer',
  'participant',
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, default: 'participant' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

    // Academic identifiers (used to trace public feedback links back to students)
    rollNumber: { type: String, trim: true, index: true },
    className: { type: String, trim: true },
    batch: { type: String, trim: true },
    branch: { type: String, trim: true },
    section: { type: String, trim: true },
    block: { type: String, enum: ['ET', 'MT', 'T Pharmacy', 'HM', null], default: null },
    phone: { type: String, trim: true },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    googleSubject: { type: String, default: null, select: false },
    avatarUrl: { type: String, default: null },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = new Date();
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleSubject;
  return obj;
};

userSchema.index({ organization: 1, role: 1 });
userSchema.index({ googleSubject: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phoneVerified: true } });

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
