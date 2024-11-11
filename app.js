import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import errorMiddleWare from "./middlewares/error.js";

const app = express();

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: "50kb" }))
app.use(cors({ origin: "*", credentials: true }))
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
}))

import userRouter from "./routes/user.routes.js"
import employeeRouter from "./routes/employee.routes.js"
import categoryRouter from "./routes/category.routes.js"
import workinghoursRouter from "./routes/workinghours.routes.js"
import appointmentRouter from "./routes/appointment.routes.js"
import reviewRouter from "./routes/review.routes.js"
// mongodb://127.0.0.1:27017/abc
// routes declaration
app.use("/api/v1/user", userRouter)
app.use("/api/v1/emp", employeeRouter)
app.use("/api/v1/cat", categoryRouter)
app.use("/api/v1/time", workinghoursRouter)
app.use("/api/v1/appt", appointmentRouter)
app.use("/api/v1/rev", reviewRouter)
app.get("/", (req, res) => {
    res.json("Working the backends")
})

export default app;

app.use(errorMiddleWare)