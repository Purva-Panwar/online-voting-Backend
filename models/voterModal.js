



const { Schema, model, Types } = require('mongoose')

const voterSchema = new Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number, required: true },
    idnumber: { type: Number, required: true, unique: true },

    gender: { type: String, required: true, enum: ["male", "female", "other"] },
    

    // emailV
    verifyOtp: { type: String, default: '' },
    verifyOtpExpireAt: { type: Number, default: 0 },
    isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: String, default: '' },
    resetOtpExpireAt: { type: Number, default: 0 },
    isVoted: { type: Boolean, default: false },

    //emailV

    votedElections: [{ type: Types.ObjectId, ref: "Election", required: true }],
    isAdmin: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = model('Voter', voterSchema)