import { describe, it, expect } from 'vitest';
import { getValidKaizenImageUrl, getAllKaizenImageUrls } from '../lib/kaizenImageHelper';

describe('Kaizen Image Helper Tests', () => {
  it('should return empty string for undefined or empty url', () => {
    expect(getValidKaizenImageUrl(undefined)).toBe('');
    expect(getValidKaizenImageUrl('')).toBe('');
    expect(getValidKaizenImageUrl('   ')).toBe('');
  });

  it('should return the first URL from a comma-separated string', () => {
    const raw = 'https://res.cloudinary.com/demo/image1.jpg, https://res.cloudinary.com/demo/image2.jpg';
    expect(getValidKaizenImageUrl(raw)).toBe('https://res.cloudinary.com/demo/image1.jpg');
  });

  it('should transform Google Drive file links to lh3 direct image links', () => {
    const driveLink = 'https://drive.google.com/file/d/1A2B3C4D5E6F/view?usp=sharing';
    expect(getValidKaizenImageUrl(driveLink)).toBe('https://lh3.googleusercontent.com/d/1A2B3C4D5E6F');
  });

  it('should transform Google Drive open ID links', () => {
    const driveOpenLink = 'https://drive.google.com/open?id=9Z8Y7X6W5V4U';
    expect(getValidKaizenImageUrl(driveOpenLink)).toBe('https://lh3.googleusercontent.com/d/9Z8Y7X6W5V4U');
  });

  it('should fallback to attachments_json if rawUrl is empty', () => {
    const attachments = JSON.stringify([{ url: 'https://res.cloudinary.com/demo/fallback.jpg' }]);
    expect(getValidKaizenImageUrl('', attachments)).toBe('https://res.cloudinary.com/demo/fallback.jpg');
  });

  it('should extract all image URLs correctly', () => {
    const raw = 'https://res.cloudinary.com/demo/image1.jpg, https://drive.google.com/file/d/123XYZ/view';
    const attachments = JSON.stringify([{ url: 'https://res.cloudinary.com/demo/image3.jpg' }]);
    const all = getAllKaizenImageUrls(raw, attachments);
    expect(all).toEqual([
      'https://res.cloudinary.com/demo/image1.jpg',
      'https://lh3.googleusercontent.com/d/123XYZ',
      'https://res.cloudinary.com/demo/image3.jpg'
    ]);
  });

  it('should clean multi-image comma separated Cloudinary string and prevent concatenated invalid URLs', () => {
    const multi = 'https://res.cloudinary.com/demo/img1.jpg,https://res.cloudinary.com/demo/img2.jpg';
    expect(getValidKaizenImageUrl(multi)).toBe('https://res.cloudinary.com/demo/img1.jpg');
    expect(getAllKaizenImageUrls(multi)).toEqual([
      'https://res.cloudinary.com/demo/img1.jpg',
      'https://res.cloudinary.com/demo/img2.jpg'
    ]);
  });
});
