import mongoose from "mongoose";

const callSchema = new mongoose.Schema({
    clientOne: String,
    clientTwo: String,
})

const callModel = mongoose.model('CallLogs', callSchema);

export default callModel;