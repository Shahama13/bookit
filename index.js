import { config } from "dotenv"
import app from "./app.js"
import connectDB from "./db/index.js"
import cloudinary from "cloudinary"

config({
    path: "./.env"
})

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

const PORT = process.env.PORT || 3000

connectDB().then(() => {
    app.on("error", (error) => {
        console.log("ERR:", error)
        throw error
    })
    app.listen(PORT, () => {
        console.log("Server connected to PORT:", PORT)
    })
}).catch(() => {
    console.log("Mongo DB connection failed")
})

