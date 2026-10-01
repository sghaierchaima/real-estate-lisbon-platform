import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Cloudinary environment variables are missing.',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  uploadPropertyImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    if (!file?.buffer) {
      throw new InternalServerErrorException(
        'The image buffer is missing.',
      );
    }


    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'real-estate-lisbon/properties',
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            reject(
              new InternalServerErrorException(
                `Cloudinary upload failed: ${error.message}`,
              ),
            );
            return;
          }

          if (!result) {
            reject(
              new InternalServerErrorException(
                'Cloudinary returned no upload result.',
              ),
            );
            return;
          }

          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  uploadProfessionalVerification(
  file: Express.Multer.File,
): Promise<UploadApiResponse> {
  if (!file?.buffer) {
    throw new InternalServerErrorException(
      'The verification document buffer is missing.',
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder:
            'real-estate-lisbon/professional-verifications',

          resource_type: 'auto',

          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },

        (
          error:
            | UploadApiErrorResponse
            | undefined,

          result:
            | UploadApiResponse
            | undefined,
        ) => {
          if (error) {
            reject(
              new InternalServerErrorException(
                `Cloudinary verification upload failed: ${error.message}`,
              ),
            );
            return;
          }

          if (!result) {
            reject(
              new InternalServerErrorException(
                'Cloudinary returned no verification upload result.',
              ),
            );
            return;
          }

          resolve(result);
        },
      );

    uploadStream.end(file.buffer);
  });
}
}