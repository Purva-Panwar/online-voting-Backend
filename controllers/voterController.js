const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const VoterModel = require("../models/voterModal");
const HttpError = require("../models/ErrorModal");
const transporter = require("../config/nodemailer");
const mongoose = require('mongoose');

const { v4: uuid } = require("uuid")
const cloudinary = require("../utils/cloudinary")
const path = require("path")



//function to generate token
const generateToken = (payload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" })
    return token;
}



const registerVoter = async (req, res, next) => {
    try {
        const { fullName, email, password, password2, age, idnumber, gender } = req.body;


        // Validate input fields
        if (!fullName || !email || !password || !password2 || !age || !idnumber || !gender) {
            return res.status(422).json({ message: "Fill in all fields." });
        }

        // Normalize email (convert to lowercase)
        const newEmail = email.toLowerCase();

        const newidnumber = idnumber;
        // Check if the email already exists in the database
        const emailExists = await VoterModel.findOne({ email: newEmail });
        const idExists = await VoterModel.findOne({ idnumber: newidnumber });
        if (emailExists) {
            return res.status(422).json({ message: "Email already exists." });
        }
        if (idExists) {
            return res.status(422).json({ message: "VoterId already Exists" });
        }

        // Ensure password is at least 6 characters
        if (password.trim().length < 6) {
            return res.status(422).json({ message: "Password should be at least 6 characters." });
        }

        // Ensure passwords match

        if (age < 18) {
            return res.status(422).json({ message: "you are not able to vote" });
        }

        if (idnumber.trim().length !== 12) {
            return res.status(422).json({ message: "12 digit Id number" });
        }

        const validGenders = ["male", "female", "other"];
        if (!validGenders.includes(gender.toLowerCase())) {
            return res.status(422).json({ message: "Invalid gender selection." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Determine admin status
        const isAdmin = newEmail === "purvapanwar394@gmail.com";
        //emailV
        // const { id } = voter;
        // const token = generateToken({ id, isAdmin })
        //emailV
        // Create new voter in the database
        const newVoter = await VoterModel.create({
            fullName,
            email: newEmail,
            password: hashedPassword,
            age,
            idnumber: newidnumber,
            gender,

            isAdmin,

        });


        //emailV
        const token = generateToken({ id: newVoter._id, isAdmin })



        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome',
            text: `Welcome to my online voting app Welcome to my online voting app ${email}Welcome to my online voting app`
        }
        await transporter.sendMail(mailOptions);
        //emailV

        // Return success response
        res.status(201).json({
            message: `New voter ${fullName} created successfully.`,
            token: token,
            voter: newVoter,



        });
    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({ message: "Vote registration failed." });
    }
};




//editProfile
const updateVoterProfile = async (req, res) => {
    try {
        const { id } = req.params;



        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid voter ID format." });
        }

        // Find voter by ID
        let voter = await VoterModel.findById(id);
        if (!voter) {
            return res.status(404).json({ message: "Voter not found." });
        }

        // Update voter details
        const { fullName, email, password, age, idnumber, gender } = req.body;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            voter.password = await bcrypt.hash(password, salt);
        }

        voter.fullName = fullName || voter.fullName;
        voter.email = email || voter.email;
        voter.age = age || voter.age;
        voter.idnumber = idnumber || voter.idnumber;
        voter.gender = gender || voter.gender;

        // Save updated voter
        await voter.save();

        res.json({ message: "Profile updated successfully!", voter });
    } catch (error) {
        console.error("Error updating voter:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};




// // -----------------Login Voter--------
// //post: api/voters/login



const loginVoter = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new HttpError("Fill in all fields.", 422))
        }
        const newEmail = email.toLowerCase()

        const voter = await VoterModel.findOne({ email: newEmail })
        if (!voter) {
            return next(new HttpError("Invalid credentials.0", 422))
        }
        //compare passwords
        const comparePass = await bcrypt.compare(password, voter.password)
        if (!comparePass) {
            return next(new HttpError("Invalid CredentialsContainer.", 422))
        }

        const { id, isAdmin, votedElections } = voter;
        const token = generateToken({ id: voter._id, isAdmin })

        

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome',
            text: `Welcome to my online voting app Welcome to my online voting app ${email}Welcome to my online voting app`
        }
        await transporter.sendMail(mailOptions);
        // //emailV
        res.json({ token, id, votedElections, isAdmin })


    } catch (error) {
        return next(new HttpError("Login failed.Please check your credentials or try again later.", 422))
    }
}


const logoutVoter = async (req, res, next) => {
    try {
       
        res.json({ success: "true", message: "logout " })
    } catch (error) {
        return next(new HttpError("Logout failed.Please check your credentials or try again later.", 422))
    }
}





const sendVerifyOtp = async (req, res, next) => {
    try {
        const { voterId } = req.body;

        if (!voterId) {
            return next(new HttpError("Voter ID is required.", 400));
        }

        console.log("Searching for voter with ID:", voterId);
        const user = await VoterModel.findById(voterId);

        if (!user) {
            return next(new HttpError("User not found.", 404));
        }

        if (user.isAccountVerified) {
            return next(new HttpError("Account already verified.", 400));
        }

        // Generate a 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        // Store OTP and expiration time
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        // Send OTP email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account Verification OTP",
            text: `Your OTP is ${otp}. Verify your account using this OTP.`,
            // html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: `Verification code sent to ${user.email}` });

    } catch (err) {
        console.error("Error in sendVerifyOtp:", err);
        next(new HttpError("Failed to send OTP. Try again later.", 500));
    }
};





// //verify otp
const verifyEmail = async (req, res, next) => {
    const { voterId } = req.body;
    
    const { otp } = req.body;
    
    if (!voterId) {
        return next(new HttpError("Missing details. votedId", 400));
    }
    if (!otp) {
        return next(new HttpError("Missing details. otp", 400));
    }
    try {
        const user = await VoterModel.findById(voterId);
        if (!user) {
            return next(new HttpError("User not found.", 404));
        }

        if (!user.verifyOtp || user.verifyOtp !== otp) {
            return next(new HttpError("Invalid OTP.", 400));
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return next(new HttpError("Expired OTP.", 400));
        }

        // Verify the account
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
        await user.save();

        res.status(200).json({ success: true, message: "voterId verification successful." });

    } catch (error) {
        next(new HttpError("voterId verification failed. Try again later.", 500));
    }
};










//user authentication
const isAuthenticated = async (req, res) => {
    try {
        return res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


//send password reset otp



const sendResetOtp = async (req, res) => {
    const { email } = req.body;
 
    console.log(email);

    if (!email) {
        return res.json({ success: false, message: 'Email is required' })
    }
    try {
        const user = await VoterModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        // const token = generateToken({ id: user._id })
        // Store OTP and expiration time
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
        await user.save();

        // Send OTP email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email, 
            subject: "Password reset  OTP",
               text: `Your OTP for resetting your password is ${otp} . Use this OTP to proceed with resetting your password.`,
        };

        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: 'OTP send to your email' })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

//reset password
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.json({ success: false, message: 'EMAIL,OTP and new password are required' })
    }
    try {

        const user = await VoterModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }
        if (user.resetOtp === "" || user.resetOtp !== otp) {
            return res.json({ success: false, message: 'Invalid OTP' })
        }
        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: 'OTP Expired' })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;
        await user.save();
        return res.json({ success: true, message: 'password has been reset successfully' })




    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}



//emailv



// -----------------get Voter--------
//get: api/voters/:id
const getVoter = async (req, res, next) => {
    try {
        const { id } = req.params;
        const voter = await VoterModel.findById(id).select("-password")
        if (!voter) {
            return next(new HttpError("User not found", 404))
        }
        res.json(voter)
    }
    catch (error) {
        return next(new HttpError("Couldn't get Voter", 404))
    }
}






module.exports = { registerVoter, updateVoterProfile, loginVoter, logoutVoter, sendVerifyOtp, verifyEmail, isAuthenticated, sendResetOtp, resetPassword, getVoter }