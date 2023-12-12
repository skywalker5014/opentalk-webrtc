import express from 'express';
import userModel from '../../utilities/db_handler/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';


const app = express();

app.use(express.json());

const port = process.env.AUTH_PORT || 3001;

//api endpoint for new user registration into the database
app.post('/register',async (req,res) => {
    try {
        const {username, email, password} = req.body; 
        //hashing the plain text password before saving into database
        bcrypt.genSalt(10, async(err, salt) => {
            err ? console.log("at gensalt" + ' ' + err) : 
                bcrypt.hash(password, salt, async (err, result) => {
                    if(err){
                        console.log('at hashing' + ' ' + err)
                    } else {
                        //create new user model instance with data captured from request and save into database  
                        const newuser = new userModel({username: username, email: email, password: result})
                        await newuser.save(); 
                        res.status(201).json('registration done');
                    }  
            })
        })
        
        } catch (error) {
        console.log(`error at /register: \n ${error}`);
        res.status(400).json('bad request try again')
    }
});

//api endpoint for user login
app.post('/login', async (req,res) => {
    try {
        const {email, password} = req.body;
        console.log(`email: ${email} \n password: ${password}`);
        const user = await userModel.findOne({email: email});
        //a function to generate the jwt token
        async function createToken(payload){
            try {
                return jwt.sign({payload}, "secretkey" , {expiresIn: '1h'})
            } catch (error) {
                console.log(`at jwtsign \n ${error}`);
            }
        }
        //if user is already registered proceed
        if(user.password !== null){
            //compare the password with its hash stored in database
            console.log(user.password)
            bcrypt.compare(password, user.password, async (err, result) => {
                //if password is correct create and send a jwt token
                err ? console.log(err) : res.status(200).json({
                    message: 'login success',
                    access_key: await createToken(email.toString())
                })
            })
        } else {
            //if user is not registered
            res.status(404).json('user not found')
        }
    } catch (error) {
        res.status(400).json('bad request try again')
    }
})



app.listen(port,() => {
     console.log(`auth service running at ${port}`);
     mongoose.connect('mongodb://127.0.0.1:27017/');
    });