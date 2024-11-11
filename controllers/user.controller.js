import User from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import catchAsyncError from "../utils/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js"
import generateAccessAndRefreshTokens from "../utils/generateTokens.js";
import sendEmail from "../utils/sendMail.js";
import jwt from "jsonwebtoken"
import cloudinary from "cloudinary"
import fs from "fs"
import Category from "../models/category.model.js";

export const registerUser = catchAsyncError(async (req, res, next) => {
    //   recieve the fields
    const { fullname, email, password } = req.body;
    // check if any exisiting users
    if (!fullname || !email || !password) return next(new ErrorHandler("All fields required", 400))
    const user = await User.findOne({ email, isVerified: true })
    // if yes and veriied is true return error user alraedy exist
    if (user) return next(new ErrorHandler("User already exists", 400))

    const existingUserByEmail = await User.findOne({ email });
    const OTP = Math.floor(100000 + (999999 - 100000) * Math.random())


    if (existingUserByEmail) {
        if (existingUserByEmail.isVerified) return next(new ErrorHandler("User already exists", 400))
        // if yes and not verified then generate verifyToken and expiryToken again and send Mail
        else {
            existingUserByEmail.fullname = fullname
            existingUserByEmail.password = password
            existingUserByEmail.verifyCode = OTP
            existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 1800000);
            await existingUserByEmail.save()
        }
    }
    else {
        // if not generate verufyCode and verifyCde expiry and create a new user and send Mail
        await User.create({
            fullname,
            email,
            password,
            verifyCode: OTP,
            verifyCodeExpiry: new Date(Date.now() + 1800000)
        })
    }

    await sendEmail(email, "Verification OTP", `OTP to verify email is ${OTP}`)

    const newUser = await User.findOne({ email })

    return res.status(201).json(new ApiResponse(200, newUser, "User registered, Please verify your email"))

})

export const verifyUserEmail = catchAsyncError(async (req, res, next) => {
    // search user with the otp he entered and check if it hasnt expired
    // if the search is right then set the user as verified
    const { OTP } = req.body
    if (!OTP) return next(new ErrorHandler("OTP required", 400))
    const user = await User.findOne({ verifyCode: OTP }).select("+verifyCode +verifyCodeExpiry")
    if (!user) return next(new ErrorHandler("Invalid OTP", 400))
    if (user.verifyCodeExpiry < Date.now()) return next(new ErrorHandler("OTP expired, Register again", 400))

    if (user.verifyCode.toString() != OTP) return next(new ErrorHandler("Invalid OTP", 400))
    await User.findByIdAndUpdate(user._id, {
        $unset: {
            verifyCode: 1,
            verifyCodeExpiry: 1,
        },
        $set: {
            isVerified: true
        }
    }, { new: true })
    return res.status(200).json(new ApiResponse(200, {}, "Email verified, You can login now"))
})

export const loginUser = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body
    if (!email || !password) return next(new ErrorHandler("Enter email and password", 400))
    const user = await User.findOne({ email }).select("+password")
    if (!user) return next(new ErrorHandler("User doesn't exist", 400))
    if (!user.isVerified) return next(new ErrorHandler("Email unverified, verify to login or register again", 400))
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) return next(new ErrorHandler("Invalid credentials", 400))
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, "user")
    const loggedInUser = await User.findById(user._id)

    res.status(200)
        .cookie("accessToken", accessToken, {
            secure: true,
            httpOnly: true,
            // maxAge: 48 * 60 * 60 * 1000
            // maxAge:  60 * 1000
        })
        .cookie("refreshToken", refreshToken, {
            secure: true,
            httpOnly: true,
            // maxAge: 48 * 60 * 60 * 1000
            // maxAge: 20 * 24 * 60 * 60 * 1000
        })
        .json(
            new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Welcome!")
        )

})

export const loginAdmin = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body
    if (!email || !password) return next(new ErrorHandler("Enter email and password", 400))
    const user = await User.findOne({ email }).select("+password")
    if (!user) return next(new ErrorHandler("User doesn't exist", 400))
    if (user.role !== 'admin') return next(new ErrorHandler("Not an admin account", 400))
    // if (!user.isVerified) return next(new ErrorHandler("Email unverified, verify to login or register again", 400))
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) return next(new ErrorHandler("Invalid credentials", 400))
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, "user")
    const loggedInUser = await User.findById(user._id)

    res.status(200)
        .cookie("accessToken", accessToken, {
            secure: true,
            httpOnly: true,
            // maxAge: 48 * 60 * 60 * 1000
            // maxAge:  60 * 1000
        })
        .cookie("refreshToken", refreshToken, {
            secure: true,
            httpOnly: true,
            // maxAge: 48 * 60 * 60 * 1000
            // maxAge: 20 * 24 * 60 * 60 * 1000
        })
        .json(
            new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Welcome!")
        )

})

export const getCurrentUser = catchAsyncError(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, ""))
})

export const getAccessToken = catchAsyncError(async (req, res, next) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) return next(new ErrorHandler("Unauthorized request", 401))
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN)
    const user = await User.findById(decodedToken?._id).select("+refreshToken")
    if (!user) return next(new ErrorHandler("Invalid refreshToken", 401))
    if (incomingRefreshToken !== user?.refreshToken) return next(new ErrorHandler("RefreshToken expired or used", 402))

    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user._id, "user")
    const options = { httpOnly: true, secure: true }
    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed successfully"))
})

export const logoutUser = catchAsyncError(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        { new: true })
    const options = {
        httpOnly: true,
        secure: true,
    }
    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))
})

export const sendResetPasswordMail = catchAsyncError(async (req, res, next) => {
    const { email } = req.body
    if (!email) return next(new ErrorHandler("Enter email", 400))
    const user = await User.findOne({ email })
    if (!user) return next(new ErrorHandler("User not found", 404))
    const resetOTP = Math.floor(100000 + (999999 - 100000) * Math.random())
    user.resetPasswordOTP = resetOTP
    user.resetPasswordExpiry = Date.now() + 15 * 60 * 1000
    await user.save()
    await sendEmail(email, "Reset Password OTP", `OTP to reset password is ${resetOTP}`)
    res.status(200).json(new ApiResponse(200, {}, "OTP sent to reset password"))
})

export const resetPassword = catchAsyncError(async (req, res, next) => {
    const { OTP, newPassword } = req.body
    if (!OTP || !newPassword) return next(new ErrorHandler("Enter OTP and new password", 400))
    const user = await User.findOne({ resetPasswordOTP: OTP })
    if (!user || user?.resetPasswordExpiry < Date.now()) return next(new ErrorHandler("Invalid or expired OTP", 500))
    user.password = newPassword
    await user.save()
    await User.findByIdAndUpdate(user._id, {
        $unset: {
            resetPasswordOTP: 1,
            resetPasswordExpiry: 1,
        }
    })
    res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"))
})

export const changeCurrentPassword = catchAsyncError(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id).select("+password")
    const isTrue = await user.isPasswordCorrect(oldPassword)
    if (!isTrue) return next(new ErrorHandler("Invalid Password", 400))
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})


export const changeAvatar = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id)
    console.log(req.files)//
    console.log(req.body.fullname)
    // if (req.files === undefined) return next(new ErrorHandler("Upload image", 400))
    if (req.files !== null) {
        console.log("in avatar")
        if (user.avatar?.public_id) await cloudinary.v2.uploader.destroy(user.avatar.public_id)
        const avatar = req.files.avatar.tempFilePath;
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "Appointment"
        })
        fs.rmSync("./tmp", { recursive: true })
        user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        }
    }
    if (req.body.fullname) { console.log("in fullname"); user.fullname = req.body.fullname }
    await user.save()
    return res.status(200).json(new ApiResponse(200, user, "Profile changed"))
})

export const addRemoveFromfavs = catchAsyncError(async (req, res, next) => {
    const { id } = req.body
    const cat = await Category.findById(id)
    if (!cat) return next(new ErrorHandler("Something went wrong", 400))
    const favs = req.user.favourites.map((f) => f._id.toString())
    if (favs.includes(id)) {

        const index = req.user.favourites.indexOf(id)
        req.user.favourites.splice(index, 1)
        await req.user.save()

        return res.status(200).json(new ApiResponse(200, {}, "Removed from favourites"))
    } else {

        req.user.favourites.unshift(id)
        await req.user.save()

        return res.status(200).json(new ApiResponse(200, {}, "Added to favourites"))
    }
})