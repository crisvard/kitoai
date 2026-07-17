export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  maxChars?: number;
  supportsHashtags: boolean;
  supportsVideo: boolean;
  supportsImages: boolean;
  requiredFields: string[];
}

export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  size: number;
}

export interface PostSchedule {
  id: string;
  title: string;
  content: string;
  hashtags: string[];
  platforms: string[];
  media: MediaFile[];
  scheduledFor: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformLimits {
  [key: string]: {
    maxChars: number;
    maxHashtags: number;
    maxMedia: number;
    videoMaxSize: number; // MB
    imageMaxSize: number; // MB
  };
}