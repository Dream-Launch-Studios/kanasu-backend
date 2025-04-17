import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadToCloudinary = async (
filePath: string, p0: string, p1: { resource_type: string; format: string; }, type: "audio" | "metadata") => {
  return await cloudinary.uploader.upload(filePath, {
    resource_type: type === "audio" ? "video" : "raw",
    folder: `evaluations/${type}`,
  });
};

export default cloudinary;
