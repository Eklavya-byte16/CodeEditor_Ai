import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      minlength: [2, "Too few characters, try something stronger"],
      maxlength: [25, "Too big, cannot store in DB"],
      trim: true,
      unique: true,
    },
    password: {
    type: String,
    required: function () { return this.authProvider === "local"; },
    minlength: [5, "Too few characters, try something stronger"],
    trim: true,
},
    email: {
      type: String,
      required: [true, "Email is required"],
      minlength: [5, "Too few characters, try something stronger"],
      maxlength: [50, "Too big, cannot store in DB"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    attemptsToLogin: {
      type: Number,
      default: 0,
    },
    loginBlockedTill: {
      type: Date,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
      unique: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    photo: {
      url: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });

userSchema.virtual("isLocked").get(function () {
  if (!this.loginBlockedTill) {
    return false;
  }
  return this.loginBlockedTill > new Date();
});

userSchema.methods.resetLoginAttempts = function () {
  this.attemptsToLogin = 0;
  this.lastLogin = new Date();
  this.loginBlockedTill = null;

  return this.save();
};

userSchema.methods.increaseLoginAttempts = function () {
  this.attemptsToLogin += 1;

  if (this.attemptsToLogin >= 5) {
    this.loginBlockedTill = new Date(Date.now() + 2 * 60 * 1000); // Lock for 2 mins
  }

  return this.save();
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

userSchema.pre("save", function () {
  if (this.isModified("email") && this.email) {
    this.email = this.email.toLowerCase();
  }
});

const User = mongoose.model("User", userSchema);
export default User;
