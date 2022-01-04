const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const sharp = require("sharp");
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

const bufferToStream = (buffer) => {
    const readable = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      },
    });
    return readable;
  };

exports.post_image = async (buffer, fileName, callback) => {
    const data = await sharp(buffer).webp({ quality: 20 }).toBuffer();
    const stream = cloudinary.uploader.upload_stream({ folder: "profile_pictures", public_id: fileName.split('.')[0] },
        (error, result) => {
            if (typeof callback === "function") {
                if (error) return callback(null, error.message);
                callback(result.url, null);
            } else {
                console.log("No callback!");
            }
        }
    );
    bufferToStream(data).pipe(stream);
};
