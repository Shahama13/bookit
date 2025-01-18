import express from "express"
import { userAuth, employeeAuth } from "../middlewares/auth.js"
import { rateAppointment, getEmployeesReview } from "../controllers/review.controller.js"

const router = express.Router()

router.route("/:id").post(userAuth, rateAppointment)
router.route("/my/:id").get( getEmployeesReview)

export default router