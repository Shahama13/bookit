import Employee from "../models/employee.model.js"
import User from "../models/user.model.js"
import catchAsyncError from "../utils/catchAsyncError.js"
import ErrorHandler from "../utils/ErrorHandler.js"
import jwt from "jsonwebtoken"

export const userAuth = catchAsyncError(async (req, _, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    // console.log(req.headers)
    // console.log(token)

    if (!token) return next(new ErrorHandler("Unauthorized request", 401))

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN)

    const user = await User.findById(decodedToken?._id).populate("favourites")

    if (!user) return next(new ErrorHandler("User not found", 404))

    req.user = user

    next()
})

export const adminauth = catchAsyncError(async (req, _, next) => {
    if (req.user.role !== "admin") return next(new ErrorHandler("Unauthorized request", 403))
    next()
})

export const employeeAuth = catchAsyncError(async (req, _, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    // console.log(req.cookies)

    if (!token) return next(new ErrorHandler("Unauthorized request", 401))

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN)

    const employee = await Employee.findById(decodedToken?._id)

    if (!employee) return next(new ErrorHandler("User not found", 404))

    req.employee = employee

    next()
})