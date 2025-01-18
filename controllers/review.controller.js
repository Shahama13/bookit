import Appointment from "../models/appointment.model.js"
import Employee from "../models/employee.model.js"
import Review from "../models/review.model.js"
import ApiResponse from "../utils/ApiResponse.js"
import catchAsyncError from "../utils/catchAsyncError.js"
import ErrorHandler from "../utils/ErrorHandler.js"

export const rateAppointment = catchAsyncError(async (req, res, next) => {
    const { rating, comment, category } = req.body
    // return console.log(rating)
    const appt = await Appointment.findById(req.params.id)
    if (!appt) return next(new ErrorHandler("Appointment not found", 404))
    if (appt.status !== "Completed") return next(new ErrorHandler("Pending appointments cannot be rated", 400))
    if (!appt.review) {

        const review = await Review.create({
            rating,
            comment,
            category,
            employee: appt.employee,
            user: req.user._id,
        })

        appt.review = review._id
        await appt.save()

    }

    else return next(new ErrorHandler("You already reviewed this appointment", 400))

    let sum = 0
    let noOfAppts = 0
    const appts = await Appointment.find({ employee: appt.employee }).populate("review")
    appts.forEach((appointment) => {
        if (appointment.review) {
            sum += appointment.review.rating
            ++noOfAppts
        }
    })

    const employee = await Employee.findById(appt.employee)
    employee.avgRating = sum / noOfAppts
    await employee.save()

    return res.status(201).json(new ApiResponse(201, {}, "Appointmnet reviewed"))
})

export const getEmployeesReview = catchAsyncError(async (req, res, next) => {
    const reviews = await Review.find({ employee: req.params.id }).populate({path:"user", select:"avatar fullname email"})
    if (!reviews) return next(new ErrorHandler("No reviews yet", 400))
    return res.status(201).json(new ApiResponse(201, reviews?.reverse(), ""))
})

