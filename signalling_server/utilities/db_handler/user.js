import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    online: {
        type: Boolean,
        default: true
    }
})

const userModel = mongoose.model('User', userSchema);

export default userModel;