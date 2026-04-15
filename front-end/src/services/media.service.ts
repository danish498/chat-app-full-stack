import api from './api';

export interface MediaUploadResponse {
  success: boolean;
  data: {
    url: string;
    publicId?: string;
    resourceType?: string;
  };
}

const mediaService = {
  /**
   * Upload an image file.
   * Calls POST /api/media/upload/image with multipart/form-data.
   */
  uploadImage: async (file: File): Promise<MediaUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/media/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  /**
   * Upload a video file.
   * Calls POST /api/media/upload/video with multipart/form-data.
   */
  uploadVideo: async (file: File): Promise<MediaUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/media/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },
};

export default mediaService;
