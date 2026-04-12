import rateLimit from "express-rate-limit";


const rateLimiter = rateLimit({
    windowMs:15*60*1000,
    max:5,
    message:{
        error:"Too Many Request!!! Retry in 15 minutes"
    },
    standardHeaders:true,
    legacyHeaders:true,
});

export default rateLimiter;