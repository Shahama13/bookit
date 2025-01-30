import Category from "../models/category.model.js";
import Employee from "../models/employee.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import catchAsyncError from "../utils/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import User from "../models/user.model.js";
import Review from "../models/review.model.js";

export const createCategory = catchAsyncError(async (req, res, next) => {
    const { name, durationInminutes, imageUrl, special, employee, description } = req.body
    const category = await Category.findOne({ name });
    if (category) return next(new ErrorHandler("Category already exists", 400))
    await Category.create({
        name, durationInminutes, imageUrl, special, employee, description
    })
    return res.status(201).json(new ApiResponse(201, {}, "Category created"))
})

export const deleteCat = catchAsyncError(async (req, res) => {
    const { id } = req.params
    const category = await Category.findByIdAndDelete(id)

    const users = await User.find({ favourites: { $in: id } })

    if (users.length > 0) {
        users.forEach(async (element) => {

            const user = await User.findById(element._id)

            const index = user.favourites.indexOf(id)
            user.favourites.splice(index, 1)
            await user.save()
        })
    }

    if (category.professionals.length > 0) {
        category.professionals.forEach(async (element) => {
            const employee = await Employee.findById(element)


            const index = employee.speciality.indexOf(id)
            employee.speciality.splice(index, 1)
            await employee.save()


        });
    }
    res.status(200).json(new ApiResponse(200, {}, "Category deleted"))
})

export const getAllCategories = catchAsyncError(async (req, res) => {
    const { search } = req.query
    const filter = {};
    if (search) {
        filter.name = { $regex: search, $options: 'i' }
    }
    console.log(filter)
    const categories = await Category.find(filter)
    res.status(200).json(new ApiResponse(200, categories, ""))
})

export const catById = catchAsyncError(async (req, res) => {
    const category = await Category.findById(req.params.id).populate({
        path: 'professionals',
        populate: {
            path: 'speciality',
            model: 'Category',
            select: 'name'
        }
    });
    const reviews = await Review.find({ category: req.params.id }).populate({ path: "user", select: "fullname avatar" })
    if (!category) return next(new ErrorHandler("Category doesn't exist", 400))
    res.status(200).json(new ApiResponse(200, { category, reviews }, ""))
})

export const updateCategory = catchAsyncError(async (req, res) => {
    const { id } = req.params
    const { name, imageUrl, durationInminutes } = req.body
    const category = await Category.findByIdAndUpdate(id, { name, imageUrl, durationInminutes }, { new: true });
    if (!category) return next(new ErrorHandler("Category not found", 404))
    return res.status(200).json(new ApiResponse(200, {}, "Category updated"));
})

