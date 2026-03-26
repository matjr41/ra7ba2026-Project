import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class StorageService {
  private imgbbKey: string;

  constructor(private config: ConfigService) {
    this.imgbbKey = this.config.get<string>('IMGBB_API_KEY') || '';
    if (!this.imgbbKey) {
      throw new Error('IMGBB_API_KEY must be set');
    }
  }

  async uploadFile(file: any, folder: string = 'general'): Promise<string> {
    const startTime = Date.now();
    console.log(`[uploadFile] Start upload to ImgBB, size: ${file.size} bytes`);

    try {
      const url = await this.uploadToImgBB(file, folder);
      console.log(`[uploadFile] Completed in ${Date.now() - startTime}ms`);
      return url;
    } catch (error) {
      console.error(`[uploadFile] Failed after ${Date.now() - startTime}ms:`, error);
      throw error;
    }
  }

  private async uploadToImgBB(file: any, folder: string): Promise<string> {
    const fileBuffer = file.buffer ?? Buffer.from(await file.arrayBuffer());
    const base64 = fileBuffer.toString('base64');

    const safeName = `${folder}-${Date.now()}-${file.originalname}`.replace(/[^a-zA-Z0-9_.-]/g, '_');

    const params = new URLSearchParams();
    params.append('image', base64);
    params.append('name', safeName);

    const url = `https://api.imgbb.com/1/upload?key=${this.imgbbKey}`;

    const response = await axios.post(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const data = response.data;
    if (!data?.data?.url) {
      console.error('ImgBB upload error:', data);
      throw new Error('Failed to upload file to ImgBB');
    }

    return data.data.url as string;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // ImgBB free API does not support delete by URL; keep as a no-op for now.
    console.log('deleteFile called for ImgBB URL (no-op):', fileUrl);
  }
}
