import express from "express"
import {
    apptById,
    bookAppointment,
    cancelAppointment,
    cancelAppointmentofUserByEmployee,
    getEmployeeApptsOfEveryInternal,
    getUserApptHistory,
    markApptasCompleted,
    getTimeSlot
} from "../controllers/appointment.controller.js"
import { employeeAuth, userAuth } from "../middlewares/auth.js"

const router = express.Router()

router.route("/book").post(userAuth, bookAppointment)
router.route("/hist").get(userAuth, getUserApptHistory)
router.route("/:id").get(apptById).delete(userAuth, cancelAppointment)
router.route("/set/:id").get(employeeAuth, markApptasCompleted)
router.route("/cancel/:id").post(employeeAuth, cancelAppointmentofUserByEmployee)
router.route("/appt/:empId").get(getEmployeeApptsOfEveryInternal)
router.route("/timeslot").post(getTimeSlot)


export default router