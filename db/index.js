import mongoose from "mongoose"

const connectDB = async () => {

    try {
        const { connection } = await mongoose.connect(process.env.MONGO_URI)
        console.log("Database connected to ", connection.host)
    } catch (error) {
        console.log("Error connecting to Database", error)
        process.exit(1)
    }

}

export default connectDB