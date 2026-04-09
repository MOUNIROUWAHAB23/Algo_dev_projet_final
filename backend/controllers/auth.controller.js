import userModel from "../models/user.model.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


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
export async function signIn(req,res){
    const userdata = req.body;
    const email = userdata?.email;
    const password = userdata?.password;

    console.log(email);
    let data = await userModel.findOne({ 'email': email }, 'name email role password').exec();
    console.log(data)
    if (data) {
        if (await bcrypt.compare(password, data.password)) {
            const payload= {
                "name":data.name,
                "email":data.email,
                "role":data.role,
            }
            const token = jwt.sign(payload,process.env.JWT_SECRET,{
                expiresIn:'3H'
            })
            return res.status(200).json({
                "code": "200",
                "message": "authentification réussi",
                "Token":token
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

}