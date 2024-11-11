import { Schema, model } from "mongoose";

const workingHoursSchema = new Schema({
    monday: {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        open: { type: Boolean, default: true }
    },
    tuesday: {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        open: { type: Boolean, default: true }
    },
    wednesday: {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        open: { type: Boolean, default: true }
    },
    thursday: {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        open: { type: Boolean, default: true }
    },
    friday: {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        open: { type: Boolean, default: true }
    },
    saturday: {
        start: { type: Date },
        end: { type: Date },
        open: { type: Boolean, default: false }
    },
    sunday: {
        start: { type: Date },
        end: { type: Date },
        open: { type: Boolean, default: false }
    },
    employee: {
        type: Schema.Types.ObjectId,
        ref: "Employee",
        required: true
    }
   
}, { timestamps: true })

const Workinghours = model("Workinghours", workingHoursSchema)

export default Workinghours