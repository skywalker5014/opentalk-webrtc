import userModel from "../../utilities/db_handler/user.js";
import jwt from "jsonwebtoken";
import express from "express";
import mongoose from "mongoose";
import callModel from "../../utilities/db_handler/callLog.js";
import { v4 as uuidv4 } from 'uuid';

const app = express();

//send contacts 
app.get('/home',async (req,res) => {
    if(req.headers.authorization !== null){
        try {
            const email = jwt.verify(req.headers.authorization, "secretkey");
            const contacts = await userModel.find({email: {$ne: email.payload}})
            res.status(200).json(contacts)
        } catch (error) {
            res.status(404).json("something went wrong")
        }
    }
})

//save call logs
app.post('/call', async (req,res) => {
    if(req.headers.authorization !== null){
        try {
            const email = jwt.verify(req.headers.authorization, "secretkey");
            const {answerer} = req.body;
            const newcall = new callModel({clientOne: email, clientTwo: answerer});
            await newcall.save();
            res.status(200).json("call saved")
        } catch (error) {
            res.status(404).json("something went wrong")
        }
    }
})



app.listen(3002, () => {
    mongoose.connect('mongodb://127.0.0.1:27017/');
    console.log("home service running at 3002");
})