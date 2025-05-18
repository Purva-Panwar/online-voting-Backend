const { Router } = require("express")

const { registerVoter, updateVoterProfile, loginVoter, logoutVoter, sendVerifyOtp, isAuthenticated, getVoter, verifyEmail, sendResetOtp, resetPassword } = require("../controllers/voterController")
const { addElection, getElection, getElections, updateElection, removeElection, getCandidateOfElection, getElectionVoters } = require("../controllers/electionController")
const { addCandidate, getCandidate, removeCandidate, voteCandidate } = require("../controllers/candidateController")


const authMiddleware = require("../middleware/authMiddleware")
// const { default: EditProfile } = require("../../frontend/src/pages/EditProfile")
// const userAuth = require("../middleware/authMiddleware")

const router = Router()

router.post('/voters/register', registerVoter);
router.put('/voters/:id', authMiddleware, updateVoterProfile);

router.post('/voters/login', loginVoter);

router.post('/voters/logout', authMiddleware, logoutVoter);

// 

///not userid access in req.ody 
router.post('/voters/send-otp', authMiddleware, sendVerifyOtp);
router.post('/voters/verify-otp', authMiddleware, verifyEmail);


router.post('/voters/is-auth', authMiddleware, isAuthenticated);
router.post('/voters/send-reset-otp', sendResetOtp);
router.post('/voters/reset-password', resetPassword);

router.get('/voters/:id', authMiddleware, getVoter);


router.post('/elections', authMiddleware, addElection)
router.get('/elections', authMiddleware, getElections)
router.get('/elections/:id', authMiddleware, getElection)
router.delete('/elections/:id', authMiddleware, removeElection)
router.patch('/elections/:id', authMiddleware, updateElection)
router.get('/elections/:id/candidates', authMiddleware, getCandidateOfElection)
router.get('/elections/:id/voters', authMiddleware, getElectionVoters)



router.post('/candidates', authMiddleware, addCandidate)
router.get('/candidates/:id', authMiddleware, getCandidate)
router.delete('/candidates/:id', authMiddleware, removeCandidate)
router.patch('/candidates/:id', authMiddleware, voteCandidate)


module.exports = router