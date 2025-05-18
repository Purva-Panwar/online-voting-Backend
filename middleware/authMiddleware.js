





const jwt = require("jsonwebtoken");
const HttpError = require("../models/ErrorModal");

const authMiddleware = async (req, res, next) => {
    try {
        let authorizationHeader = req.headers.authorization || req.headers.Authorization;

        if (!authorizationHeader) {
            return next(new HttpError("Unauthorized. No token provided.", 401));
        }

        // Trim any unwanted spaces
        authorizationHeader = authorizationHeader.trim();

        // Check for correct format
        if (!authorizationHeader.startsWith("Bearer ")) {
            return next(new HttpError("Unauthorized. Invalid token format.", 400));
        }

        // Extract the token
        const token = authorizationHeader.split(" ")[1];

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return next(new HttpError("Unauthorized. Invalid token.", 403));
            }

            // Attach user ID to request
            req.voterId = decoded.id || decoded._id;
            req.user = decoded;
            next();
        });
    } catch (error) {
        return next(new HttpError("Authentication failed. Try again.", 500));
    }
};

module.exports = authMiddleware;

// // //emialV
// const userAuth = async (req, res, next) => {
//     const { token } = req.cookies;

//     if (!token) {
//         return next(new HttpError({ success: false, message: "not Authorized . Login  Again " }))
//     }
//     try {
//         const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
//         if (tokenDecode.id) {
//             req.body.voterId = tokenDecode.id
//         }
//         else {
//             return next(new HttpError({ success: false, message: "not Authorized . Login  Again " }))
//         }
//         next();
//     } catch (error) {
//         return next(new HttpError({ success: false, message: error.message }));

//     }
// }
// module.exports = userAuth;

// // const jwt = require("jsonwebtoken")
// // const HttpError = require('../models/ErrorModal')


// // const authMiddleware = async (req, res, next) => {
// //     const Authorization = req.headers.Authorization || req.headers.authorization;

// //     if (Authorization && Authorization.startsWith("Bearer")) {
// //         const token = Authorization.split(' ')[1]

// //         jwt.verify(token, process.env.JWT_SECRET, (err, info) => {
// //             if (err) {
// //                 return next(new HttpError("Unauthorizes Invalid token", 400))
// //             }

// //             req.user = info
// //             next()
// //         }
// //         )
// //     }
// //     else {
// //         return next(new HttpError("Unauthorized . No token.", 400))
// //     }
// // }


// // module.exports = authMiddleware;