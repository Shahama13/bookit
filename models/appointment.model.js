import { Schema, model } from "mongoose";

const appointmentSchema = new Schema({
    bookedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    employee: {
        type: Schema.Types.ObjectId,
        ref: "Employee"
    },
    apptFor: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },
    startTime: {
        type: Date,
        required: [true, "StartTime is required"]
    },
    endTime: {
        type: Date,
        required: [true, "EndTime is required"]
    },
    status: {
        type: String,
        enum: ['Booked', 'Completed', 'Cancelled'],
        default: 'Booked'
    },
    cancelReason: String,
    review: {
        type: Schema.Types.ObjectId,
        ref: "Review"
    }

}, { timestamps: true })

const Appointment = model("Appointment", appointmentSchema)

export default Appointment