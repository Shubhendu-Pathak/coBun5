import express from 'express'
import { addToPlaylist, changePassword, deleteUser, forgetpassword, getAllUsers, getMyProfile, login, logout, register, removefromPlaylist, resetpassword, updateUserRole, updateprofiie, updateprofilePicture } from '../controllers/userController.js'
import {authorizeAdmin, isAuthenticated} from '../middlewares/auth.js'
import singleUpload from '../middlewares/multer.js'

const router = express.Router()

//register
router.route('/register').post(singleUpload,register)


// login
router.route('/login').post(login)

// logout
router.route('/logout').get(logout)

//getMyProfile
router.route('/me').get(isAuthenticated,getMyProfile)

//changepassword
router.route('/changepassword').put(isAuthenticated,changePassword)

// updateprofiie

router.route("/updateprofiie").put(isAuthenticated,updateprofiie)

// updateprofilePicture
router.route('/updateprofilepicture').put(isAuthenticated,singleUpload,updateprofilePicture)


// forgot password
router
.route('/forgetpassword')
.post(forgetpassword)

// restpassword
router.route('/resetpassword/:token').put(resetpassword)

// add tp playlist
router
.route('/addtoplaylist')
.post(isAuthenticated,addToPlaylist)

// remve from playlist
router
.route('/removefromplaylist')
.delete(isAuthenticated,removefromPlaylist)

// Admin Routes
router.route("/admin/users").get(isAuthenticated, authorizeAdmin, getAllUsers);

router
  .route("/admin/user/:id")
  .put(isAuthenticated, authorizeAdmin, updateUserRole)
  .delete(isAuthenticated, authorizeAdmin, deleteUser);


export default router