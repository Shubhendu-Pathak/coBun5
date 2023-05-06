import express from 'express'
import { addLecture, createCourse, deleteCourse, deleteLecture, getAllCourses, getCourseLectures } from '../controllers/courseController.js'
import {authorizeAdmin, isAuthenticated} from '../middlewares/auth.js'
import singleUpload from '../middlewares/multer.js'

const router = express.Router()

// get All course
router.route('/courses').get(getAllCourses)

// create couse
router.route('/createcourse').post(isAuthenticated, authorizeAdmin,singleUpload,createCourse)

// acecess lecture, add lecture
router
.route('/course/:id')
.get(isAuthenticated,getCourseLectures)
.post(isAuthenticated,authorizeAdmin,singleUpload,addLecture)
.delete(isAuthenticated, authorizeAdmin, deleteCourse);

// Delete Lecture
router.route("/lecture").delete(isAuthenticated, authorizeAdmin, deleteLecture);

export default router