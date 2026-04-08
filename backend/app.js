import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import auth from './routes/auth.route.js';
import hebergementModel from './models/hebergement.model.js';
import userModel from './models/user.model.js';



const app = express();

app.use(cors());

app.use(express.json());
mongoose.connect(process.env.MONGO_URI)
app.post('/sign-up',auth)
app.post('/sign-in', async (req, res) => {
    const userdata = req.body;
    const email = userdata?.email;
    const password = userdata?.password;

    console.log(email);
    let data = await userModel.findOne({ 'email': email }, 'password').exec();
    console.log(data)
    if (data) {
        if (await bcrypt.compare(password, data.password)) {
            return res.status(200).json({
                "code": "200",
                "message": "tout se passe bien"
            })
        }
        return res.status(400).json({
            "code": "400",
            "message": "Invalid paswword"
        })

    }

    return res.status(400).json({
        "code": "400",
        "message": "Invalid email"
    })

})

const PORT = process.env.PORT || 3500;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})