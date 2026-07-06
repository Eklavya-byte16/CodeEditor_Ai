import mongoos from "mongoose";
const tokenSchema = new mongoos.Schema(
  {
    userId: {
      type: mongoos.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },

    refreshToken: {
      type: String,
      required: [true, "Refrash token is required"],
      unique: true,
      index: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    RevokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
tokenSchema.index({ userId: 1 }, { isRevoked: 1 });

tokenSchema.virtual("isExpired").get(function () {
  return this.expiresAt < new Date();
});

tokenSchema.virtual("isValid").get(function () {
  return !this.isExpired && !this.isRevoked;
});

tokenSchema.methods.revoke = function () {
  this.isRevoked = true;
  this.RevokedAt = new Date();
  return this.save();
};

tokenSchema.statics.findValidToken = function (token) {
  return this.findOne({
    refreshToken: token,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

tokenSchema.statics.revokeUserTokens = function (userId) {
  return this.updateMany(
    { userId: userId, isRevoked: false },
    { isRevoked: true, RevokedAt: new Date() },
  );
};
tokenSchema.statics.findActiveTokens = function (userId) {
  return this.find({
    userId: userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

tokenSchema.statics.countActiveSessions = function (userId) {
  return this.countDocuments({
    userId: userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

tokenSchema.pre(/^find/, function () {
  if (!this.options._recrsed) {
    this.where({ isRevoked: false });
    this.where({ expiresAt: { $gt: new Date() } });
  }
});

const Token = mongoos.model("Token", tokenSchema);

export default Token;
