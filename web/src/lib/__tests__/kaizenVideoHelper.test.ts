import { describe, it, expect } from "vitest";
import {
  isKaizenVideoUrl,
  isKaizenImageUrl,
  normalizeKaizenVideoUrl,
  splitKaizenMedia,
  getValidKaizenVideoUrl,
  getAllKaizenVideoUrls,
} from "../kaizenVideoHelper";

describe("kaizenVideoHelper", () => {
  describe("isKaizenVideoUrl", () => {
    it("nhận diện đúng các đuôi file video phổ biến (không phân biệt hoa/thường)", () => {
      expect(isKaizenVideoUrl("https://example.com/video.mp4")).toBe(true);
      expect(isKaizenVideoUrl("https://example.com/video.MOV")).toBe(true);
      expect(isKaizenVideoUrl("https://example.com/video.webm")).toBe(true);
      expect(isKaizenVideoUrl("https://example.com/video.m4v")).toBe(true);
      expect(isKaizenVideoUrl("https://example.com/video.3gp")).toBe(true);
      expect(isKaizenVideoUrl("https://example.com/video.avi")).toBe(true);
      expect(isKaizenVideoUrl("https://example.com/video.mkv")).toBe(true);
    });

    it("nhận diện video khi URL có query string hoặc hash", () => {
      expect(
        isKaizenVideoUrl("https://pub-4f6913e79588469588d95eecea9146ea.r2.dev/sample.mov?token=xyz123&exp=99999#t=0")
      ).toBe(true);
      expect(
        isKaizenVideoUrl("/cdn-r2/sample.MP4?v=1#preview")
      ).toBe(true);
    });

    it("nhận diện MIME type video và data URI", () => {
      expect(isKaizenVideoUrl("video/mp4")).toBe(true);
      expect(isKaizenVideoUrl("video/quicktime")).toBe(true);
      expect(isKaizenVideoUrl("data:video/mp4;base64,AAAA...")).toBe(true);
    });

    it("từ chối URL ảnh hoặc chuỗi rỗng / null / undefined", () => {
      expect(isKaizenVideoUrl("https://example.com/photo.jpg")).toBe(false);
      expect(isKaizenVideoUrl("https://example.com/photo.png")).toBe(false);
      expect(isKaizenVideoUrl("https://example.com/photo.webp")).toBe(false);
      expect(isKaizenVideoUrl("")).toBe(false);
      expect(isKaizenVideoUrl(null)).toBe(false);
      expect(isKaizenVideoUrl(undefined)).toBe(false);
      expect(isKaizenVideoUrl("undefined")).toBe(false);
    });
  });

  describe("isKaizenImageUrl", () => {
    it("nhận diện đúng các đuôi file ảnh", () => {
      expect(isKaizenImageUrl("https://example.com/photo.jpg")).toBe(true);
      expect(isKaizenImageUrl("https://example.com/photo.PNG")).toBe(true);
      expect(isKaizenImageUrl("https://example.com/photo.webp")).toBe(true);
      expect(isKaizenImageUrl("https://example.com/photo.heic")).toBe(true);
    });

    it("từ chối video", () => {
      expect(isKaizenImageUrl("https://example.com/video.mov")).toBe(false);
      expect(isKaizenImageUrl("https://example.com/video.mp4")).toBe(false);
    });
  });

  describe("normalizeKaizenVideoUrl", () => {
    it("chuyển đổi Cloudflare R2 bucket sang proxy /cdn-r2", () => {
      const r2Url = "https://pub-4f6913e79588469588d95eecea9146ea.r2.dev/uoaxlvlldtlf3akdqsad.mov";
      const normalized = normalizeKaizenVideoUrl(r2Url);
      expect(normalized).toBe("/cdn-r2/uoaxlvlldtlf3akdqsad.mov");
    });
  });

  describe("splitKaizenMedia - Phân loại media của đề xuất", () => {
    it("bóc tách chính xác case thẻ 'Lưu thanh chuyền' (ID: ci_1791451397343_vx4q2)", () => {
      const proposal = {
        id: "ci_1791451397343_vx4q2",
        code: "KZ-2026-KG1-GO-0001",
        before_image_url: "https://pub-4f6913e79588469588d95eecea9146ea.r2.dev/83489839-2c70-4e04-afc3-559d4c207eeb.jpg",
        after_image_url: "https://pub-4f6913e79588469588d95eecea9146ea.r2.dev/63cb7c05-b0aa-43e8-8a8b-c6b753f2c589.jpg",
        before_video_url: null,
        after_video_url: null,
        attachments_json: JSON.stringify([
          {
            type: "video_before",
            url: "https://pub-4f6913e79588469588d95eecea9146ea.r2.dev/uoaxlvlldtlf3akdqsad.mov",
            title: "Video TRƯỚC Cải Tiến",
          },
          {
            type: "video_after",
            url: "https://pub-4f6913e79588469588d95eecea9146ea.r2.dev/zu0vvzfs6rl9x07mdiz3.mov",
            title: "Video SAU Cải Tiến",
          },
        ]),
      };

      const result = splitKaizenMedia(proposal);

      expect(result.beforeVideos.length).toBe(1);
      expect(result.afterVideos.length).toBe(1);
      expect(result.primaryBeforeVideo).toBe("/cdn-r2/uoaxlvlldtlf3akdqsad.mov");
      expect(result.primaryAfterVideo).toBe("/cdn-r2/zu0vvzfs6rl9x07mdiz3.mov");

      expect(result.primaryBeforeImage).toBe("/cdn-r2/83489839-2c70-4e04-afc3-559d4c207eeb.jpg");
      expect(result.primaryAfterImage).toBe("/cdn-r2/63cb7c05-b0aa-43e8-8a8b-c6b753f2c589.jpg");
    });

    it("hỗ trợ cả dữ liệu legacy khi trước/sau nằm ở field direct", () => {
      const legacyProposal = {
        before_video_url: "https://r2.dev/old_before.mp4",
        after_video_url: "https://r2.dev/old_after.mp4",
        attachments_json: null,
      };

      const result = splitKaizenMedia(legacyProposal);
      expect(result.primaryBeforeVideo).toBe("/cdn-r2/old_before.mp4");
      expect(result.primaryAfterVideo).toBe("/cdn-r2/old_after.mp4");
    });

    it("xử lý thẻ không có video", () => {
      const noVideoProposal = {
        before_image_url: "https://r2.dev/img_before.jpg",
        after_image_url: "https://r2.dev/img_after.jpg",
        before_video_url: null,
        after_video_url: null,
        attachments_json: "[]",
      };

      const result = splitKaizenMedia(noVideoProposal);
      expect(result.beforeVideos.length).toBe(0);
      expect(result.afterVideos.length).toBe(0);
      expect(result.primaryBeforeVideo).toBe("");
      expect(result.primaryAfterVideo).toBe("");
    });
  });

  describe("getValidKaizenVideoUrl & getAllKaizenVideoUrls", () => {
    it("lấy đúng URL và danh sách video", () => {
      const atts = JSON.stringify([
        { url: "https://r2.dev/v1.mp4", tag: "BEFORE" },
        { url: "https://r2.dev/v2.mov", tag: "BEFORE" },
        { url: "https://r2.dev/v3.webm", tag: "AFTER" },
      ]);

      const primaryBefore = getValidKaizenVideoUrl(null, atts, "BEFORE");
      expect(primaryBefore).toBe("/cdn-r2/v1.mp4");

      const allBefore = getAllKaizenVideoUrls(null, atts, "BEFORE");
      expect(allBefore).toEqual(["/cdn-r2/v1.mp4", "/cdn-r2/v2.mov"]);

      const primaryAfter = getValidKaizenVideoUrl(null, atts, "AFTER");
      expect(primaryAfter).toBe("/cdn-r2/v3.webm");
    });
  });
});
