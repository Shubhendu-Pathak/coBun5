import {User} from '../models/userModel.js'
import {Course} from '../models/courseModel.js'
import {catchAsyncError} from '../middlewares/catchAsyncError.js'
import ErrorHandler from '../utils/errorHandler.js'
import { sendToken } from '../utils/sendToken.js'
import { sendEmail } from '../utils/sendEmail.js'
import crypto from 'crypto'
import getDataUri from '../utils/dataUri.js' 
import cloudinary from 'cloudinary'
import {Stats} from '../models/statsModel.js'

export const register = catchAsyncError(
    async(req,res,next)=>{

const {name,email,password} = req.body

if(!name || !email || !password) return next( new ErrorHandler("Enter Details",400) )

let user = await User.findOne({email})
if(user) return next( new ErrorHandler("User Exists",400) )

const file = req.file
const fileUri = getDataUri(file)
const mycloud = await cloudinary.v2.uploader.upload(fileUri.content)

user = await User.create({
    name,
    email,
    password,
    avatar:{
        public_id:mycloud.public_id,
        url:mycloud.secure_url
    }
})

sendToken(res,user,"Registered Succesfull",201)

    }
)

// login

export const login =catchAsyncError(async(req,res,next)=>{

    const {email,password} = req.body
    
    if( !email || !password ){
        return next(new ErrorHandler('Please enter fields',400))
    }
    
    const user = await User.findOne({email}).select("+password")
    
    if(!user) {
        return next(new ErrorHandler("Incorrect email or password",401))
    }
    
    const isMatch = await user.comparePassword(password)
    
    if(!isMatch){
        return next(new ErrorHandler("Incorrect email or password",401))
    }
    
    sendToken(res,user,'LOGIN SUCCESS '+ ' Welcome ' + user.name,201)
    
    })

    // logout

    export const logout = catchAsyncError(
        async(req,res,next)=>{

res
.status(200)
.cookie("token",null,{expires:new Date(Date.now())})
.json({status:true,message:"Logout Successful"})
        }
    )

    // get Profile

    export const getMyProfile = catchAsyncError(
        async(req,res,next)=>{

const user = await User.findById(req.user._id)

res.status(200).json({success:true,user,message:"WELCOME BACK "+req.user.name})

        }
    )

    // changepassword

export const changePassword = catchAsyncError(async(req,res,next)=>{

    const {oldPassword,newPassword} = req.body
    
    if( !newPassword || !oldPassword ){
        return next(new ErrorHandler('Please enter fields',400))
    }
    
    const user = await User.findById(req.user.id).select("+password")
    
    const isMatch = await user.comparePassword(oldPassword)
    
    if( !isMatch ){
     return next(new ErrorHandler('Incorrrect Password',400))
    }
    
    user.password = newPassword
    await user.save()
    
    res
    .status(200)
    .json({success:true,user,message:"Password ChANGED SUCCESSFULLY"})
    
    })

    // updateprofiie

export const updateprofiie = catchAsyncError(async(req,res,next)=>{

    const {name,email} = req.body
    
    
    const user = await User.findById(req.user._id).select("+password")
    
    if(name) user.name = name
    if(email) user.email = email
    
    await user.save()
    
    res
     .status(200)
     .json({success:true,user,message:"Profile Updated SUCCESSFULLY"})
    
    
    })
    
    // update profile picture
    
    export const updateprofilePicture =catchAsyncError(async(req,res,next)=>{

        const file = req.file

        const user = await User.findById(req.user._id)

        const fileUri = getDataUri(file)
        const mycloud = await cloudinary.v2.uploader.upload(fileUri.content)

    await cloudinary.v2.uploader.destroy(user.avatar.public_id)

    user.avatar = {
        public_id:mycloud.public_id,
        url:mycloud.secure_url
    }

    await user.save()
    
        res.status(200).json({
            success:true,
            message:"Profile Picture Ipdatesd Successfully"
        })
     })

     // forgot password

     export const forgetpassword = catchAsyncError(
        async(req,res,next)=>{

const {email} = req.body

const user = await User.findOne({email}) 

if(!user) {
    return next(new ErrorHandler("NO USER FOUND",400))
}

const resetToken = await user.getReseTToken()

await user.save()

const link = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`
const message = `Click on the link to reset password ${link} . Ignore if not requested` 

await sendEmail(user.email,"Course bundeler Reset Password",message)

res.status(200).json({
    success:true,
    message:"REST TOKEN SENT Successfully to "+ user.email
})

        }
     )

    //  reset password

    export const  resetpassword =catchAsyncError(async(req,res,next)=>{

        const {token} = req.params
        
        const resetPasswordToken =crypto
        .createHash("sha256")
        .update(token)
        .digest("hex")
        
        const user= await User.findOne({
            resetPasswordToken,
            resetPasswordExpire:{$gt:Date.now()}
        })
        
        if(!user) return next(new ErrorHandler('TOKEN NOT FOUND OR EXPIRE',400))
        
        user.password = req.body.password
        
        user.resetPasswordExpire = undefined
        user.resetPasswordToken  = undefined
        
        await user.save()
        
            res.status(200).json({
                success:true,
                message:"RESET PASSWORD Successfully",token
            })
         })
        
        //  addtoplaylist

        export const addToPlaylist = catchAsyncError(
            async(req,res,next)=>{

const user = await User.findById(req.user._id)
const course = await Course.findById(req.body.id)

if(!course) return next(new ErrorHandler("Course not Found",404))

user.playlist.push({
    course:course._id,
    poster:course.poster.url
            })

await user.save()

res.status(200).json({
    success: true,
    message: "Added to playlist",
})

            }
        )

 // remove from playlist
 
 export const removefromPlaylist = catchAsyncError(
    async(req,res,next)=>{

        const user = await User.findById(req.user._id);
        const course = await Course.findById(req.query.id);

        if (!course) return next(new ErrorHandler("Invalid Course Id", 404));
        
        const newPlaylist = user.playlist.filter((item) => {
            if (item.course.toString() !== course._id.toString()) return item;
          });
          
          user.playlist = newPlaylist;
          await user.save();
          res.status(200).json({
            success: true,
            message: "Removed From Playlist",
          });  

    }
 )

//  admin

 export const getAllUsers = catchAsyncError(async (req, res, next) => {
    const users = await User.find({});
  
    res.status(200).json({
      success: true,
      users,
    });
  });
  
  export const updateUserRole = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
  
    if (!user) return next(new ErrorHandler("User not found", 404));
  
    if (user.role === "user") user.role = "admin";
    else user.role = "user";
  
    await user.save();
  
    res.status(200).json({
      success: true,
      message: "Role Updated",
    });
  });
  
  export const deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
  
    if (!user) return next(new ErrorHandler("User not found", 404));
  
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  
    // Cancel Subscription
  
    await user.deleteOne();
  
    res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
    });
  });
  
  export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);
  
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  
    // Cancel Subscription
  
    await user.deleteOne();
  
    res
      .status(200)
      .cookie("token", null, {
        expires: new Date(Date.now()),
      })
      .json({
        success: true,
        message: "User Deleted Successfully",
      }); 
  });

  User.watch().on("change", async () => {
    const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);
  
    const subscription = await User.find({ "subscription.status": "active" });
    stats[0].users = await User.countDocuments();
    stats[0].subscription = subscription.length;
    stats[0].createdAt = new Date(Date.now());
  
    await stats[0].save();
  });