const { Schema, model, Types } = require('mongoose');

const electionSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true }, // Only date, no time
    endDate: { type: Date, required: true },   // Only date, no time
    startTime: { type: String, required: true }, // HH:mm format (string)
    endTime: { type: String, required: true },   // HH:mm format (string)
    thumbnail: { type: String, required: true },
    candidates: [{ type: Types.ObjectId, required: true, ref: "Candidate" }],
    voters: [{ type: Types.ObjectId, required: true, ref: "Voter" }],
});

module.exports = model("Election", electionSchema);



