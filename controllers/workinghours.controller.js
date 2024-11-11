import Workinghours from "../models/workinghours.model.js";
import catchAsyncError from "../utils/catchAsyncError.js";
import ApiResponse from "../utils/ApiResponse.js"
import ErrorHandler from "../utils/ErrorHandler.js";

export const setWorkinghours = catchAsyncError(async (req, res, next) => {
    const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = req.body;
    if (!monday || !tuesday || !wednesday || !thursday || !friday || !saturday || !sunday) return next(new ErrorHandler("Required fields are missing"))
    const existingWorkhours = await Workinghours.findOne({ employee: req.employee._id })
    if (existingWorkhours) return next(new ErrorHandler("Working hours aleady exist for this employee"))
    const workingHours = new Workinghours({
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        employee: req.employee._id
    });
    await workingHours.save();
    return res.status(200).json(new ApiResponse(200, workingHours, "Working Hours created"))
})

export const updateWorkingHours = catchAsyncError(async (req, res, next) => {
    const { id } = req.params
    const updatedHours = req.body
    const updatedWorkingHours = await Workinghours.findByIdAndUpdate(id, updatedHours, { new: true });
    if (!updatedWorkingHours) return next(new ErrorHandler("Working hours not found", 404))
    return res.status(200).json(new ApiResponse(200, updatedWorkingHours, "Working hours not found"));
})

