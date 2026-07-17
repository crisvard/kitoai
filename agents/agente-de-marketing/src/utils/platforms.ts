import { SocialPlatform } from '../types';

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'Instagram',
    color: '#E4405F',
    maxChars: 2200,
    supportsHashtags: true,
    supportsVideo: true,
    supportsImages: true,
    requiredFields: ['content']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'Facebook',
    color: '#1877F2',
    maxChars: 63206,
    supportsHashtags: true,
    supportsVideo: true,
    supportsImages: true,
    requiredFields: ['content']
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'Video',
    color: '#FF0050',
    maxChars: 300,
    supportsHashtags: true,
    supportsVideo: true,
    supportsImages: false,
    requiredFields: ['content', 'video']
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: 'MessageCircle',
    color: '#000000',
    maxChars: 500,
    supportsHashtags: true,
    supportsVideo: true,
    supportsImages: true,
    requiredFields: ['content']
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'Play',
    color: '#FF0000',
    maxChars: 5000,
    supportsHashtags: true,
    supportsVideo: true,
    supportsImages: false,
    requiredFields: ['title', 'description', 'video']
  }
];

export const PLATFORM_LIMITS = {
  instagram: {
    maxChars: 2200,
    maxHashtags: 30,
    maxMedia: 10,
    videoMaxSize: 100,
    imageMaxSize: 8
  },
  facebook: {
    maxChars: 63206,
    maxHashtags: 50,
    maxMedia: 100,
    videoMaxSize: 1000,
    imageMaxSize: 25
  },
  tiktok: {
    maxChars: 300,
    maxHashtags: 100,
    maxMedia: 1,
    videoMaxSize: 500,
    imageMaxSize: 0
  },
  threads: {
    maxChars: 500,
    maxHashtags: 30,
    maxMedia: 10,
    videoMaxSize: 100,
    imageMaxSize: 8
  },
  youtube: {
    maxChars: 5000,
    maxHashtags: 15,
    maxMedia: 1,
    videoMaxSize: 2000,
    imageMaxSize: 0
  }
};