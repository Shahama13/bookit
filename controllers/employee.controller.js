import Employee from "../models/employee.model.js";
import User from "../models/employee.model.js";
import catchAsyncError from "../utils/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import fs from "fs"
import cloudinary from "cloudinary"
import sendEmail from "../utils/sendMail.js";
import ApiResponse from "../utils/ApiResponse.js";
import Category from "../models/category.model.js";
import generateAccessAndRefreshTokens from "../utils/generateTokens.js";
import jwt from "jsonwebtoken"
import Review from "../models/review.model.js";

export const registerEmployee = catchAsyncError(async (req, res, next) => {

    const { fullname, email, password, description, speciality } = req.body;
    // check if any exisiting users
    if (!fullname || !email || !password || !description || req.files === undefined) return next(new ErrorHandler("All fields required", 400))
    let specialityArray = []
    if (speciality) { specialityArray = JSON.parse(speciality) }

    const temp = await User.findOne({ email })
    if (temp) return next(new ErrorHandler("User exists with this account", 400))

    const employee = await Employee.findOne({ email, isVerified: true })
    if (employee) return next(new ErrorHandler("Employee already exists", 400))

    const existingUserByEmail = await Employee.findOne({ email });
    const OTP = Math.floor(100000 + (999999 - 100000) * Math.random())
    const avatar = req.files.avatar.tempFilePath;

    if (existingUserByEmail) {
        if (existingUserByEmail.isVerified) return next(new ErrorHandler("Employee already exists", 400))
        // if yes and not verified then generate verifyToken and expiryToken again and send Mail
        else {
            existingUserByEmail.password = password
            existingUserByEmail.verifyCode = OTP
            existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 1800000);
            await existingUserByEmail.save()
        }
    }
    else {
        // if not generate verufyCode and verifyCde expiry and create a new employee and send Mail

        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "Appointment"
        })
        fs.rmSync("./tmp", { recursive: true })

        const employee = await Employee.create({
            fullname,
            email,
            password,
            description,
            speciality: specialityArray,
            verifyCode: OTP,
            verifyCodeExpiry: new Date(Date.now() + 1800000),
            avatar: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        })
        if (speciality) {
            specialityArray.forEach(async (element) => {
                const category = await Category.findById(element);
                if (!category) return
                if (!category.professionals.includes(employee._id)) { category.professionals.push(employee._id) }
                await category.save()
            });
        }
    }

    await sendEmail(email, "Verification OTP", `OTP to verify your email is ${OTP}`)

    const newUser = await Employee.findOne({ email })

    return res.status(201).json(new ApiResponse(200, newUser, "Employee registered, Please verify email"))

})


export const verifyEmployeeEmail = catchAsyncError(async (req, res, next) => {
    // search employee with the otp he entered and check if it hasnt expired
    // if the search is right then set the employee as verified
    const { OTP } = req.body
    if (!OTP) return next(new ErrorHandler("OTP required", 400))
    const employee = await Employee.findOne({ verifyCode: OTP }).select("+verifyCode +verifyCodeExpiry")
    if (!employee) return next(new ErrorHandler("Invalid OTP", 400))
    if (employee.verifyCodeExpiry < Date.now()) return next(new ErrorHandler("OTP expired, Register again", 400))

    if (employee.verifyCode.toString() != OTP) return next(new ErrorHandler("Invalid OTP", 400))
    await Employee.findByIdAndUpdate(employee._id, {
        $unset: {
            verifyCode: 1,
            verifyCodeExpiry: 1,
        },
        $set: {
            isVerified: true
        }
    }, { new: true })
    return res.status(200).json(new ApiResponse(200, {}, "Email verified, Employee can login now"))
})

export const loginEmployee = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body
    if (!email || !password) return next(new ErrorHandler("Enter email and password", 400))
    const employee = await Employee.findOne({ email }).select("+password")
    if (!employee) return next(new ErrorHandler("User doesn't exist", 400))
    if (!employee.isVerified) return next(new ErrorHandler("Email unverified, verify to login or register again", 400))
    const isPasswordCorrect = await employee.isPasswordCorrect(password)
    if (!isPasswordCorrect) return next(new ErrorHandler("Invalid credentials", 400))
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(employee._id, "employee")
    const loggedInEmployee = await Employee.findById(employee._id)

    res.status(200)
        .cookie("accessToken", accessToken, {
            secure: true,
            httpOnly: true,
            // maxAge: 48 * 60 * 60 * 1000
        })
        .cookie("refreshToken", refreshToken, {
            secure: true,
            httpOnly: true,
            // maxAge: 20 * 24 * 60 * 60 * 1000
        })
        .json(
            new ApiResponse(200, { employee: loggedInEmployee, accessToken, refreshToken }, "Welcome!")
        )

})

export const getCurrentEmployee = catchAsyncError(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.employee, ""))
})

export const getAccessToken = catchAsyncError(async (req, res, next) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) return next(new ErrorHandler("Unauthorized request", 401))
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN)
    const employee = await Employee.findById(decodedToken?._id).select("+refreshToken")
    if (!employee) return next(new ErrorHandler("Invalid refreshToken", 401))
    if (incomingRefreshToken !== employee?.refreshToken) return next(new ErrorHandler("RefreshToken expired or used", 402))

    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(employee._id, "employee")
    const options = { httpOnly: true, secure: true }
    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed successfully"))
})

export const logoutEmployee = catchAsyncError(async (req, res, next) => {
    await Employee.findByIdAndUpdate(req.employee._id,
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
        .json(new ApiResponse(200, {}, "Employee logged out"))
})

export const sendResetPasswordMail = catchAsyncError(async (req, res, next) => {
    const { email } = req.body
    if (!email) return next(new ErrorHandler("Enter email", 400))
    const employee = await Employee.findOne({ email })
    if (!employee) return next(new ErrorHandler("User not found", 404))
    const resetOTP = Math.floor(100000 + (999999 - 100000) * Math.random())
    employee.resetPasswordOTP = resetOTP
    employee.resetPasswordExpiry = Date.now() + 15 * 60 * 1000
    await employee.save()
    await sendEmail(email, "Reset Password OTP", `OTP to reset password is ${resetOTP}`)
    res.status(200).json(new ApiResponse(200, {}, "OTP sent to reset password"))
})

export const resetPassword = catchAsyncError(async (req, res, next) => {
    const { OTP, newPassword } = req.body
    if (!OTP || !newPassword) return next(new ErrorHandler("Enter OTP and new password", 400))
    const employee = await Employee.findOne({ resetPasswordOTP: OTP })
    if (!employee || employee?.resetPasswordExpiry < Date.now()) return next(new ErrorHandler("Invalid or expired OTP", 500))
    employee.password = newPassword
    await employee.save()
    await Employee.findByIdAndUpdate(employee._id, {
        $unset: {
            resetPasswordOTP: 1,
            resetPasswordExpiry: 1,
        }
    })
    res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"))
})

export const changeCurrentPassword = catchAsyncError(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body
    const employee = await Employee.findById(req.employee?._id).select("+password")
    const isTrue = await employee.isPasswordCorrect(oldPassword)
    if (!isTrue) return next(new ErrorHandler("Invalid Password", 400))
    employee.password = newPassword
    await employee.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

export const changeAvatar = catchAsyncError(async (req, res, next) => {

    const employee = await Employee.findById(req.employee._id)

    if (req.files !== null) {
        if (employee.avatar?.public_id) await cloudinary.v2.uploader.destroy(employee.avatar.public_id)
        // if (req.files === undefined) return next(new ErrorHandler("Upload image", 400))
        const avatar = req.files.avatar.tempFilePath;
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "Appointment"
        })
        fs.rmSync("./tmp", { recursive: true })
        employee.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        }
    }
    if (req.body.fullname) { employee.fullname = req.body.fullname }
    if (req.body.description) { employee.description = req.body.description }
    await employee.save()
    return res.status(200).json(new ApiResponse(200, employee, "Profile changed"))
})

export const getAllEmployees = catchAsyncError(async (_, res) => {
    const employees = await Employee.find().populate({ path: "speciality", select: "name" })
    res.status(200).json(new ApiResponse(200, employees, ""))
})

export const empById = catchAsyncError(async (req, res, next) => {
    const employee = await Employee.findById(req.params.id).populate({ path: "speciality", select: "name" })
    const category = await Category.find({ employee: req.params.id })
    const reviews = await Review.find({
        employee: req.params.id,
        category: { $exists: false } // Check if category field does not exist
    }).populate({ path: "user", select: "fullname avatar" });
    if (!employee) return next(new ErrorHandler("Employee not found", 400))
    res.status(200).json(new ApiResponse(200, { employee, category, reviews }, ""))
})

export const deleteEmployee = catchAsyncError(async (req, res, next) => {
    const { id } = req.params
    const employee = await Employee.findByIdAndDelete(id)
    if (!employee) return next(new ErrorHandler("Employee not found", 400))
    await cloudinary.v2.uploader.destroy(employee.avatar.public_id)
    if (employee.speciality.length > 0) {
        employee.speciality.forEach(async (element) => {
            const category = await Category.findById(element)
            const index = category.professionals.indexOf(id)
            category.professionals.splice(index, 1)
            await category.save()
        });
    }
    res.status(200).json(new ApiResponse(200, {}, "Employee deleted"))
})

export const updateEmployee = catchAsyncError(async (req, res, next) => {
    const { fullname, description, speciality } = req.body;

    if (Object.keys(req.body).length === 0) {
        return next(new ErrorHandler("Empty request", 400));
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
        return next(new ErrorHandler("Employee not found", 404));
    }

    if (fullname) employee.fullname = fullname;
    if (description) employee.description = description;

    if (speciality) {
        const specialityArray = JSON.parse(speciality);
        employee.speciality = specialityArray;

        // Fetch all categories
        const categories = await Category.find();

        // Loop through each category and update professionals
        for (const category of categories) {
            const isEmployeeInCategory = specialityArray.includes(category._id.toString());

            if (isEmployeeInCategory) {
                // Add employee to category if not already present
                if (!category.professionals.includes(employee._id)) {
                    category.professionals.push(employee._id);
                }
            } else {
                // Remove employee from category if present
                const index = category.professionals.indexOf(employee._id);
                if (index !== -1) {
                    category.professionals.splice(index, 1);
                }
            }

            // Save the category only once per iteration
            await category.save();
        }
    }

    // Save the employee document
    await employee.save();

    return res.status(200).json(new ApiResponse(200, employee, 'Employee details updated successfully'));
});