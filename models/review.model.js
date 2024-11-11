import { Schema, model } from "mongoose";

const reviewSchema = new Schema({
    rating: {
        type: Number,
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
    employee: {
        type: Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true })

const Review = model("Review", reviewSchema)

export default Review