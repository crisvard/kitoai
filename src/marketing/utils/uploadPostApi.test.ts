import { describe, it, expect, vi } from 'vitest';
import { uploadMedia, schedulePost, getPostStatus } from './uploadPostApi';

// Mock fetch
global.fetch = vi.fn();

describe('uploadPostApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload media successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: 'https://example.com/media.jpg' }),
    });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const result = await uploadMedia(file);

    expect(result).toBe('https://example.com/media.jpg');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/upload'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should schedule post successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ postId: '123' }),
    });

    const postData = {
      platforms: ['instagram'],
      content: 'Test post',
      hashtags: ['#test'],
      mediaUrls: [],
      scheduledAt: '2025-01-20T14:30:00Z',
    };

    const result = await schedulePost(postData);

    expect(result).toEqual({ postId: '123' });
  });

  it('should get post status successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'published' }),
    });

    const result = await getPostStatus('123');

    expect(result).toEqual({ status: 'published' });
  });

  it('should throw error on failed request', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
    });

    await expect(uploadMedia(new File([], 'test.jpg'))).rejects.toThrow('Upload failed: Unauthorized');
  });
});