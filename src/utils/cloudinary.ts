import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { v4 as uuidv4 } from "uuid";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadToCloudinary = async (
  filePath: string,
  type: "audio" | "image" | "metadata",
  providedPublicId?: string // optional
) => {
  // Hardcode extension for audio as ".mp3"
  const extension = type === "audio" ? ".mp3" : path.extname(filePath); // force .mp3 for audio
  const baseName = path.basename(filePath, path.extname(filePath)); // always strip actual ext for baseName
  const uuid = uuidv4();

  // Compose publicId with forced extension for audio, or actual extension otherwise
  const publicId = providedPublicId
    ? providedPublicId.endsWith(extension)
      ? providedPublicId
      : providedPublicId + extension
    : `${baseName}-${uuid}${extension}`;

  // Set the resource type
  const resource_type = type === "image" ? "image" : "raw"; // audio and metadata are "raw"

  return await cloudinary.uploader.upload(filePath, {
    resource_type,
    public_id: publicId,
    folder: `evaluations/${type}`,
    use_filename: true,
    unique_filename: false,
    overwrite: true,
  });
};

export default cloudinary;
