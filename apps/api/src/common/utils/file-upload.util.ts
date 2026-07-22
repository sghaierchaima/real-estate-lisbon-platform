import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

export function validateImageFile(file?: Express.Multer.File) {
  if (!file) {
    throw new BadRequestException('Image file is required');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new BadRequestException(
      'Invalid file type. Only JPG, PNG and WebP images are allowed.',
    );
  }

  const extension = extname(file.originalname).toLowerCase();

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    throw new BadRequestException(
      'Invalid file extension. Only .jpg, .jpeg, .png and .webp are allowed.',
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new BadRequestException('Image size must not exceed 2 MB.');
  }
}

export function generateSafeImageFilename(originalName: string) {
  const extension = extname(originalName).toLowerCase();

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    throw new BadRequestException('Invalid image extension.');
  }

  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
}