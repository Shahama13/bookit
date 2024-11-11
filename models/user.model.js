import { Schema, model } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema({
    fullname: {
        type: String,
        required: [true, "Fullname is required"],
        minLength: [3, "Fullname should be atleast 3 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: [6, "Password should be atleast 6 characters"],
        select: false,
    },
    resetPasswordOTP: Number,
    resetPasswordExpiry: Date,
    verifyCode: {
        type: Number,
        required: [true, "Verify code is required"],
        select: false
    },
    verifyCodeExpiry: {
        type: Date,
        required: [true, "Verify code expiry is required"],
        select: false
    },
    avatar: {
        public_id: String,
        url: String
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    refreshToken: {
        type: String,
        select: false,
    },
    favourites: [{
        type: Schema.Types.ObjectId,
        ref: "Category"
    }],
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    }
}, { timestamps: true })

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function () {
    return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN, {
        expiresIn: process.env.ACCESS_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN, {
        expiresIn: process.env.REFRESH_EXPIRY
    })
}

const User = model("User", userSchema)

export default User