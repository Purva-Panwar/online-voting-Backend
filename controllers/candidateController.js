const { v4: uuid } = require("uuid")
const cloudinary = require("../utils/cloudinary")
const path = require("path")
const ElectionModel = require("../models/electionModal")
const CandidateModel = require("../models/candidateModal")
const VoterModel = require("../models/voterModal")
const HttpError = require('../models/ErrorModal')
const mongoose = require("mongoose")




// / ------------add candidates--------------
//post: api/candidate
//protexted only(admin)
const addCandidate = async (req, res, next) => {
    try {
        // only admin can add election
        if (!req.user.isAdmin) {
            return next(new HttpError("Only an admin can perform this action", 403))
        }

        const { fullName, motto, currentElection } = req.body;
        if (!fullName || !motto) {
            return next(new HttpError("Fill in all blanks.", 422))
        }
        if (!req.files.image) {
            return next(new HttpError("Choose an Image", 422))
        }

        const { image } = req.files
        //check file size
        if (image.size > 1000000) {
            return next(new HttpError("image size should be less than 1mb", 422))
        }
        //rename the image
        let fileName = image.name;
        fileName = fileName.split(".")
        fileName = fileName[0] + uuid() + "." + fileName[(fileName.length) - 1]

        //uploads file to uploads folder
        image.mv(path.join(__dirname, '..', 'uploads', fileName), async (err) => {
            if (err) {
                return next(HttpError(err))
            }
            //store imageon cloudianry
            const result = await cloudinary.uploader.upload(path.join(__dirname, '..', "uploads", fileName), { resource_type: "image" })
            if (!result.secure_url) {
                return next(new HttpError("Couldn't upload image to cloudinary", 422));
            }
            //add candidate to db
            let newCandidate = await CandidateModel.create({ fullName, motto, image: result.secure_url, election: currentElection })

            //get election  and push candidate to election
            let election = await ElectionModel.findById(currentElection)

            const sess = await mongoose.startSession()
            sess.startTransaction()
            await newCandidate.save({ session: sess })
            election.candidates.push(newCandidate)
            await election.save({ session: sess })
            await sess.commitTransaction()

            res.status(201).json("Candidate added sucessfully")
        })

    } catch (err) {
        return next(new HttpError(err))
    }
}



// ------------get candidates--------------
//post: api/candidate/:id
//protexted only(admin)
const getCandidate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const candidate = await CandidateModel.findById(id);
        res.json(candidate)
    } catch (error) {
        return next(new HttpError(error))
    }

}


// ------------Delete candidates--------------
//post: api/candidate/:id
//protexted only(admin)
const removeCandidate = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) {
            return next(new HttpError("Only an admin can perform this action", 403))
        }

        const { id } = req.params;
        let currentCandidate = await CandidateModel.findById(id).populate('election')
        if (!currentCandidate) {
            return next(new HttpError("Couldn't delete candidate", 422))
        }
        else {
            const sess = await mongoose.startSession()
            sess.startTransaction()
            await currentCandidate.deleteOne({ session: sess })
            currentCandidate.election.candidates.pull(currentCandidate);
            await currentCandidate.election.save({ session: sess })
            await sess.commitTransaction()

            res.status(200).json("Candidate deleted successfully")
        }
    } catch (error) {
        return next(new HttpError(error)
        )
    }
}



// ------------Vote candidates--------------
//post: api/candidate/:id
//protexted only(admin)




const voteCandidate = async (req, res, next) => {
    try {
        const { id: candidateId } = req.params;
        const { currentVoterId, selectedElection } = req.body;
        // const candidate = await Candidate.findByIdAndUpdate(
        //     req.params.id,
        //     { $inc: { votes: 1 } },
        //     { new: true }
        // );
        //get tghe candidate
        const candidate = await CandidateModel.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found" });
        }
        const newVoteCount = candidate.voteCount + 1;

        //update candidate votes
        await CandidateModel.findByIdAndUpdate(candidateId, { voteCount: newVoteCount }, { new: true })

        //start session for relationship
        const sess = await mongoose.startSession()
        sess.startTransaction()

        //get the current voter
        let voter = await VoterModel.findById(currentVoterId)
        await voter.save({ session: sess })

        //get selected election
        let election = await ElectionModel.findById(selectedElection);
        election.voters.push(voter);
        voter.votedElections.push(election);
        await election.save({ session: sess })
        await voter.save({ session: sess })
        await sess.commitTransaction();
        res.status(200).json(voter.votedElections)
    }
    catch (error) {
        return next(new HttpError(error))
    }
}



module.exports = { addCandidate, getCandidate, removeCandidate, voteCandidate }