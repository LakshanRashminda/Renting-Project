import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { isAdmin, isAuth } from '../utils.js';

const upload = multer();

const uploadRouter = express.Router();

//router for upload images to cloudinary
uploadRouter.post(
    '/',
    isAuth,
    isAdmin,
    upload.single('file'),
    async (req, res) => {
        // Configure Cloudinary using environment variables
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        // Define a function to upload the file to Cloudinary using a stream
        const streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                // Create a stream and upload the file to Cloudinary
                const stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result); // Resolve the promise with the result if successful
                    } else {
                        reject(error);  // Reject the promise with an error if unsuccessful
                    }
                });
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
        const result = await streamUpload(req); // Use the streamUpload function to upload the file to Cloudinary
        res.send(result);
    }
);
export default uploadRouter;