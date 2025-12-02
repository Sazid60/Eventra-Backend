/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


export const deleteImageFromCloudinary = async (url: string) => {
    try {
        // const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp)$/i;
        const regex = /\/v\d+\/(.*?)(\.[^/.]+)?$/;
        const match = url.match(regex);

        console.log({ match })
        if (match && match[1]) {
            const public_id = match[1];
            await cloudinary.uploader.destroy(public_id)
            console.log(`File ${public_id} is deleted from cloudinary`);
        }
    } catch (error: any) {
        throw new Error(`Cloudinary image deletion failed ${error.message}`)
    }
}



export const cloudinaryUpload = cloudinary