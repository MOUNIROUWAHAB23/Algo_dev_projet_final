import userModel from "../models/user.model.js";
import bcrypt from 'bcryptjs';


export async function signUp(req,res){
    let userdata = req.body;
        userdata.password = await bcrypt.hash(userdata.password, 10);
    
        let data = await userModel.insertOne(userdata);
    
        console.log(data.length)
    
        res.status(200).json({
            "code": "200",
            "message": "tout se passe bien"
        })
}