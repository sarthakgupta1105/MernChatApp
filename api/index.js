const express = require("express");
const app = express();
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors")
const cookieParser = require("cookie-parser");

mongoose.connect("mongodb://127.0.0.1:27017/chatapp").then(()=>console.log("database connected"));
const bcryptSalt=bcrypt.genSaltSync(10);
const jwtSecret = "secret";
app.use(cors({
    credentials:true,
    origin:"http://localhost:5173"
}))
app.use(express.json());
app.use(cookieParser());

app.get('/test',(req,res)=>{
    res.json("test");
})

app.get('/profile',(req,res)=>{
    const token=req.cookies?.token;
    if(token){
        jwt.verify(token,jwtSecret,{},(err,userData)=>{
            if(err) throw err;
            res.json(userData)
        })
    }else{
        res.status(401).json("no token")
    }
    
})

app.post('/login',async(req,res)=>{
    const {username,password}=req.body;
    try{
        let userDoc = await User.findOne({username});
        if(userDoc){
            let passOk = bcrypt.compareSync(password,userDoc.password);
            if(passOk){
                jwt.sign({username:userDoc.username,id:userDoc._id},jwtSecret,{},(err,token)=>{
                    if(err) throw err;
                    res.cookie('token',token).status(200).json('logged in')
                })
            }
        }
    }catch(e){
        throw err;
    }
})

app.post('/register',async(req,res)=>{
    const {username,password}= req.body;
    try{
        let userDoc = await User.create({
            username,
            password:bcrypt.hashSync(password,bcryptSalt)
        })
        jwt.sign({userId:userDoc._id,username},jwtSecret,{},(err,token)=>{
            if(err) throw err;
            res.cookie("token",token).status(201).json({
                id:userDoc._id,
            })
        })
    }catch(e){
        console.log(e)
    }
    
})

app.listen(8000,()=>{
    console.log("server is listening to port 8000")
})