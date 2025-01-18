import { Schema, model } from "mongoose";

const categorySchema = new Schema({
    name: String,
    description: String,
    professionals: [{
        type: Schema.Types.ObjectId,
        ref: "Employee",
        required: false,
    }],
    durationInminutes: {
        type: Number,
        required: true
    },
    imageUrl: String,
    special: {
        type: Boolean,
        default: false
    },
    employee: {
        type: Schema.Types.ObjectId,
        ref: "Employee",
        required: false,
    }
})

const Category = model("Category", categorySchema)

export default Category