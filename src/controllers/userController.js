const cloudinary = require("cloudinary").v2;
const User = require("../models/userModel");
const CustomError = require("../utility/CustomError");
const mailHelper = require("../utility/emailHelper");
const crypto = require("crypto");

// user profile
const userDashboard = async (req, res, next) => {
  try {
    const user = await User.find(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(new CustomError(error, 400));
  }
};

//update user profile
const updateUserInfo = async (req, res, next) => {
  try {
    let user = await User.findById(req.user._id);

    user = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(new CustomError(error, 400));
  }
};

// upload user photo
const uploadUserPhoto = async (req, res, next) => {
  try {
    let user = await User.findById(req.user._id);
    if (req.files) {
      if (user.image.id) {
        await cloudinary.uploader.destroy(user.image.id);
      }
      const result = await cloudinary.uploader.upload(
        req.files.avatar.tempFilePath,
        {
          folder: "users",
          width: 150,
          crop: "scale",
        }
      );

      user.image = {
        id: result.public_id,
        secure_url: result.secure_url,
      };
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: "Photo uploaded successfully",
    });
  } catch (error) {
    next(new CustomError(error, 400));
  }
};

// update user password
const updateUserPassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new CustomError("User not found", 404));
    }

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
      return new CustomError("Password update failed", 401);
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(new CustomError(error, 400));
  }
};

// forgot user password
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  const forgotToken = await user.getforgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${forgotToken}`;

  try {
    mailHelper({
      email: user.email,
      subject: "Reset Password",
      message: resetUrl,
    });

    await user.save();
    res.status(200).json({
      success: true,
      msg: "Password reset link sent to your email",
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new CustomError(error, 400));
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return next(
        new CustomError("Please enter password and confirm password", 400)
      );
    }

    const encryptedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      forgotPasswordToken: encryptedToken,
      forgotPasswordTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new CustomError("Password reset token is invalid or has expired", 400)
      );
    }

    if (password !== confirmPassword) {
      return next(new CustomError("Passwords do not match", 400));
    }
    console.log(user.password);
    user.password = password;

    await user.save();
    console.log(user.password);

    res.status(200).json({
      success: true,
      msg: "Password reset successfully",
    });
  } catch (error) {
    return next(new CustomError(error, 400));
  }
};

module.exports = {
  userDashboard,
  updateUserInfo,
  updateUserPassword,
  forgotPassword,
  resetPassword,
  uploadUserPhoto,
};
