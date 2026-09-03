export interface BrandPartner {
  id: string;
  name: string;
  logo: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShoeImageItem {
  id: string;
  url: string;
  name?: string;
  order: number;
}

export interface ShoeGroup {
  id: string;
  title: string;
  order: number;
  items: ShoeImageItem[];
}

export interface ShoeLinesConfig {
  title: string;
  groups: ShoeGroup[];
}

export interface HeroTitleLineConfig {
  text: string;
  fontSize: number;
  colorMode: "solid" | "gradient";
  color: string;
  gradient: {
    from: string;
    to: string;
    direction: "to right" | "to bottom" | "to bottom right" | "to top right";
  };
}

export interface WorkspaceImageItem {
  id: string;
  src: string;
  caption?: string;
  order: number;
}

export interface WorkspaceDepartment {
  id: string;
  name: string;
  icon: string;
  order: number;
  images: WorkspaceImageItem[];
}

export interface LandingCMSConfig {
  // 1. Hero Section
  hero: {
    titlePrefix: string;
    titleHighlight: string;
    prefixConfig?: HeroTitleLineConfig;
    highlightConfig?: HeroTitleLineConfig;
    quoteItalic: string;
    description: string;
    bgImage: string;
    handsImage: string;
    teamImage: string;
    quoteBadgeText: string;
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
  };

  // 2. Workspace Gallery
  workspace: {
    headline: string;
    description: string;
    pillars: Array<{
      title: string;
      desc: string;
    }>;
  };

  // 3. Brand Excellence
  excellence: {
    title: string;
    description: string;
    image: string;
    points: Array<{
      title: string;
      desc: string;
    }>;
  };

  // 4. Products Showcase
  products: {
    title: string;
    description: string;
    items: Array<{
      name: string;
      code: string;
      image?: string;
    }>;
  };

  // 5. Brand Partners Carousel
  brandPartners: BrandPartner[];

  // 6. Featured Shoe Lines (Dòng Giày Tiêu Biểu)
  shoeLines: ShoeLinesConfig;

  // 7. Workspace Departments Gallery
  workspaceDepartments?: WorkspaceDepartment[];
}

export const DEFAULT_BRAND_PARTNERS: BrandPartner[] = [
  { id: "bp-1", name: "Skechers", logo: "/images/brands/skechers.svg", displayOrder: 1, isActive: true },
  { id: "bp-2", name: "Decathlon", logo: "/images/brands/decathlon.svg", displayOrder: 2, isActive: true },
  { id: "bp-3", name: "ECCO", logo: "/images/brands/ecco.svg", displayOrder: 3, isActive: true },
  { id: "bp-4", name: "Cole Haan", logo: "/images/brands/cole-haan.svg", displayOrder: 4, isActive: true },
  { id: "bp-5", name: "Rockport", logo: "/images/brands/rockport.svg", displayOrder: 5, isActive: true },
  { id: "bp-6", name: "Coach", logo: "/images/brands/coach.svg", displayOrder: 6, isActive: true },
  { id: "bp-7", name: "Osprey", logo: "/images/brands/osprey.svg", displayOrder: 7, isActive: true },
  { id: "bp-8", name: "Kate Spade", logo: "/images/brands/kate-spade.svg", displayOrder: 8, isActive: true },
  { id: "bp-9", name: "Vera Bradley", logo: "/images/brands/vera-bradley.svg", displayOrder: 9, isActive: true },
];

export const DEFAULT_SHOE_GROUPS: ShoeGroup[] = [
  {
    id: "sg-1",
    title: "PERFORMANCE RUNNING",
    order: 1,
    items: [
      { id: "img-1-1", url: "/images/crawled/04.webp", name: "Skechers GoRun Speed Elite", order: 1 },
      { id: "img-1-2", url: "/images/crawled/05.webp", name: "Skechers GoRun Persistence", order: 2 },
      { id: "img-1-3", url: "/images/crawled/60.webp", name: "Skechers Arch Fit Max", order: 3 },
      { id: "img-1-4", url: "/images/crawled/005.webp", name: "Skechers Hyper Burst Runner", order: 4 },
    ],
  },
  {
    id: "sg-2",
    title: "LIFESTYLE CASUAL",
    order: 2,
    items: [
      { id: "img-2-1", url: "/images/crawled/56.webp", name: "Skechers D'Lites Memory Foam", order: 1 },
      { id: "img-2-2", url: "/images/crawled/58.webp", name: "Skechers Slip-ins Hands Free", order: 2 },
      { id: "img-2-3", url: "/images/crawled/Da-giay1.jpg", name: "Skechers Uno Stand on Air", order: 3 },
    ],
  },
  {
    id: "sg-3",
    title: "WORK & SAFETY",
    order: 3,
    items: [
      { id: "img-3-1", url: "/images/crawled/58.webp", name: "Skechers Work Steel Toe Safety", order: 1 },
      { id: "img-3-2", url: "/images/crawled/005.webp", name: "Skechers Work Slip Resistant", order: 2 },
      { id: "img-3-3", url: "/images/crawled/Da-giay1.jpg", name: "Skechers Work Composite Toe", order: 3 },
    ],
  },
];

export const DEFAULT_SHOE_LINES_CONFIG: ShoeLinesConfig = {
  title: "DÒNG GIÀY CHUỖI SKECHERS TIÊU BIỂU",
  groups: DEFAULT_SHOE_GROUPS,
};

export const DEFAULT_WORKSPACE_DEPARTMENTS: WorkspaceDepartment[] = [
  {
    id: "sanh",
    name: "Sảnh Trung Tâm",
    icon: "building",
    order: 1,
    images: [
      { id: "img-sanh-1", src: "/images/KGLV/MẶT TIỀN SẢNH.png", caption: "Không gian làm việc chuẩn mực SKECHERS", order: 1 },
      { id: "img-sanh-2", src: "/images/KGLV/SẢNH GÓC TỪ TRONG NHÌN RA.png", caption: "Khu vực điều hành chuỗi", order: 2 },
      { id: "img-sanh-3", src: "/images/KGLV/3 DÒNG GIÀY CHÍNH.png", caption: "Góc trưng bày sản phẩm kỷ niệm", order: 3 },
    ],
  },
  {
    id: "nhamay1",
    name: "Tổ hợp Nhà máy 1",
    icon: "factory",
    order: 2,
    images: [
      { id: "img-nm1-1", src: "/images/tbs-factory-plant.png", caption: "Toàn cảnh xưởng may Nhà máy 1", order: 1 },
      { id: "img-nm1-2", src: "/images/crawled/56.webp", caption: "Dây chuyền gò dán tự động SKECHERS", order: 2 },
      { id: "img-nm1-3", src: "/images/crawled/58.webp", caption: "Khu vực kiểm định chất lượng hằng ngày", order: 3 },
    ],
  },
  {
    id: "vpdieuhanh",
    name: "Văn phòng Điều hành",
    icon: "briefcase",
    order: 3,
    images: [
      { id: "img-vp-1", src: "/images/KGLV/CĐTT 2 GÓC HÌNH VP2.png", caption: "Sảnh điều hành trung tâm SKECHERS", order: 1 },
      { id: "img-vp-2", src: "/images/tbs-hands.png", caption: "Phòng làm việc Ban Điều Hành Chuỗi", order: 2 },
      { id: "img-vp-3", src: "/images/tbs-team-banner.png", caption: "Phòng họp chiến lược 1-5-2", order: 3 },
    ],
  },
];

export const DEFAULT_LANDING_CMS: LandingCMSConfig = {
  hero: {
    titlePrefix: "Văn Phòng Chuỗi",
    titleHighlight: "SKECHERS - TBS Group",
    prefixConfig: {
      text: "Văn Phòng Chuỗi",
      fontSize: 36,
      colorMode: "solid",
      color: "#ffffff",
      gradient: {
        from: "#ffffff",
        to: "#2fd39a",
        direction: "to right",
      },
    },
    highlightConfig: {
      text: "SKECHERS - TBS Group",
      fontSize: 54,
      colorMode: "gradient",
      color: "#2fd39a",
      gradient: {
        from: "#2fd39a",
        to: "#fbbf24",
        direction: "to right",
      },
    },
    quoteItalic: "“Excellence in Manufacturing. Excellence in Leadership.”",
    description:
      "Không gian điều hành đại diện cho năng lực quản trị, văn hóa doanh nghiệp và tiêu chuẩn vận hành của ngành SKECHERS - TBS Group. Thiết kế hướng đến sự tinh gọn, hiện đại và chuyên nghiệp, phản ánh vị thế của một doanh nghiệp sản xuất trong chuỗi cung ứng toàn cầu.",
    bgImage: "/images/tbs-gate.jpg",
    handsImage: "/images/tbs-hands.png",
    teamImage: "/images/tbs-team-banner.png",
    quoteBadgeText: "Chung sức kiến tạo tương lai",
    stat1Value: "30+",
    stat1Label: "Năm Kinh Nghiệm",
    stat2Value: "10M+",
    stat2Label: "Sản Phẩm / Năm",
    stat3Value: "5,000+",
    stat3Label: "Nhân Sự Vận Hành",
  },
  workspace: {
    headline: "Môi trường làm việc chuẩn Corporate",
    description:
      "Mỗi không gian được kiến tạo nhằm thúc đẩy hiệu suất, sự kết nối và tinh thần đổi mới. Đây là nơi đội ngũ cùng chia sẻ mục tiêu, nâng cao chất lượng và không ngừng hoàn thiện để mang đến những giá trị vượt kỳ vọng cho khách hàng và đối tác trên toàn cầu.",
    pillars: [
      {
        title: "Chuẩn mực không gian",
        desc: "Thiết kế hiện đại, tối giản theo tiêu chuẩn corporate, tạo nên môi trường làm việc chuyên nghiệp, đồng bộ và hiệu quả.",
      },
      {
        title: "Hiệu quả vận hành",
        desc: "Không gian được quy hoạch khoa học, tối ưu kết nối giữa các phòng ban, hỗ trợ quy trình điều hành nhanh chóng và chính xác.",
      },
      {
        title: "Bản sắc thương hiệu",
        desc: "Hệ thống nhận diện được ứng dụng xuyên suốt, phản ánh giá trị thương hiệu TBS và vị thế của doanh nghiệp trong chuỗi cung ứng toàn cầu.",
      },
      {
        title: "Môi trường truyền cảm hứng",
        desc: "Không gian mở, tiện nghi và thân thiện, khuyến khích sự hợp tác, sáng tạo và phát triển bền vững của đội ngũ.",
      },
    ],
  },
  workspaceDepartments: DEFAULT_WORKSPACE_DEPARTMENTS,
  excellence: {
    title: "Dấu Ấn Thương Hiệu & Đẳng Cấp Chuỗi Cung Ứng",
    description:
      "Văn Phòng Chuỗi SKECHERS - TBS Group tuân thủ nghiêm ngặt các tiêu chuẩn chất lượng cao nhất của đối tác SKECHERS toàn cầu. Hệ thống áp dụng quy trình số hóa 100%, nâng cao năng suất và đảm bảo an toàn lao động.",
    image: "/images/tbs-factory-plant.png",
    points: [
      {
        title: "Vận Hành Chuẩn Hóa 4.0",
        desc: "Tự động hóa báo cáo sự cố Gemba Walk và đánh giá Cải tiến CI.",
      },
      {
        title: "Kiểm Soát Chất Lượng Thời Gian Thực",
        desc: "BI Dashboard đo lường chỉ số OEE và tỷ lệ lỗi trên từng chuyền sản xuất.",
      },
      {
        title: "Tối Ưu Kaizen Bằng Trí Tuệ Nhân Tạo",
        desc: "Tích hợp AI Groq so sánh trùng lặp ý tưởng Kaizen thông minh.",
      },
    ],
  },
  products: {
    title: "Dòng Sản Phẩm Tiêu Biểu SKECHERS",
    description:
      "Các mẫu sản phẩm thuộc chuỗi cung ứng SKECHERS được sản xuất và kiểm soát chất lượng tại hệ thống nhà máy TBS Group.",
    items: [
      { name: "Performance Footwear", code: "SK-PERF-01", image: "/images/crawled/Da-giay1.jpg" },
      { name: "Lifestyle Casual Shoes", code: "SK-LIFE-02", image: "/images/crawled/04.webp" },
      { name: "Athletic Sport Line", code: "SK-SPORT-03", image: "/images/crawled/05.webp" },
      { name: "Work & Safety Shoes", code: "SK-WORK-04", image: "/images/crawled/56.webp" },
      { name: "Outdoor Trekking Series", code: "SK-OUT-05", image: "/images/crawled/58.webp" },
      { name: "Kids Comfort Collection", code: "SK-KIDS-06", image: "/images/crawled/60.webp" },
      { name: "Handbag & Accessories", code: "SK-ACC-07", image: "/images/crawled/Tui-xach1.jpg" },
      { name: "Special Edition Series", code: "SK-SPEC-08", image: "/images/crawled/005.webp" },
    ],
  },
  brandPartners: DEFAULT_BRAND_PARTNERS,
  shoeLines: DEFAULT_SHOE_LINES_CONFIG,
};

export const CMS_STORAGE_KEY = "vpchuoiskechers_landing_cms";

export function parseCMSConfig(parsed: any): LandingCMSConfig {
  if (!parsed) return DEFAULT_LANDING_CMS;

  const storedProducts = parsed.products || {};
  const storedItems = storedProducts.items || [];
  const mergedItems = [...storedItems];
  for (const defItem of DEFAULT_LANDING_CMS.products.items) {
    if (!mergedItems.some((i: any) => i.code === defItem.code)) {
      mergedItems.push(defItem);
    }
  }

  const cleanedPartners = Array.isArray(parsed.brandPartners)
    ? parsed.brandPartners.filter((p: any) => p && p.id && p.name && p.logo)
    : DEFAULT_BRAND_PARTNERS;

  const existingIds = new Set(cleanedPartners.map((p: BrandPartner) => p.id));
  const mergedPartners = [...cleanedPartners];
  for (const defPartner of DEFAULT_BRAND_PARTNERS) {
    if (!existingIds.has(defPartner.id)) {
      mergedPartners.push(defPartner);
    }
  }

  const rawShoeLines = parsed.shoeLines && Array.isArray(parsed.shoeLines.groups) && parsed.shoeLines.groups.length > 0
    ? parsed.shoeLines
    : DEFAULT_SHOE_LINES_CONFIG;

  const rawWorkspaceDeps = Array.isArray(parsed.workspaceDepartments) && parsed.workspaceDepartments.length > 0
    ? parsed.workspaceDepartments
    : DEFAULT_WORKSPACE_DEPARTMENTS;

  return {
    hero: { ...DEFAULT_LANDING_CMS.hero, ...(parsed.hero || {}) },
    workspace: { ...DEFAULT_LANDING_CMS.workspace, ...(parsed.workspace || {}) },
    workspaceDepartments: rawWorkspaceDeps,
    excellence: { ...DEFAULT_LANDING_CMS.excellence, ...(parsed.excellence || {}) },
    products: {
      title: storedProducts.title || DEFAULT_LANDING_CMS.products.title,
      description: storedProducts.description || DEFAULT_LANDING_CMS.products.description,
      items: mergedItems,
    },
    brandPartners: mergedPartners,
    shoeLines: {
      title: rawShoeLines.title || DEFAULT_SHOE_LINES_CONFIG.title,
      groups: rawShoeLines.groups || DEFAULT_SHOE_GROUPS,
    },
  };
}

export function getLandingCMS(): LandingCMSConfig {
  if (typeof window === "undefined") return DEFAULT_LANDING_CMS;
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY);
    if (!raw) return DEFAULT_LANDING_CMS;
    const parsed = JSON.parse(raw);
    return parseCMSConfig(parsed);
  } catch (e) {
    return DEFAULT_LANDING_CMS;
  }
}

export async function fetchLandingCMSFromServer(): Promise<LandingCMSConfig> {
  if (typeof window === "undefined") return DEFAULT_LANDING_CMS;

  try {
    const res = await fetch("/api/landing-cms", {
      cache: "no-store",
      headers: { "Pragma": "no-cache" },
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        const serverConfig = parseCMSConfig(json.data);
        localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(serverConfig));
        return serverConfig;
      }
    }
  } catch (err) {
    console.warn("[CMS SERVER FETCH WARN]", err);
  }

  return getLandingCMS();
}

export async function checkAndMigrateLocalCMSToServer(): Promise<LandingCMSConfig | null> {
  if (typeof window === "undefined") return null;
  const rawLocal = localStorage.getItem(CMS_STORAGE_KEY);
  if (!rawLocal) return null;

  try {
    const localConfig = getLandingCMS();
    const isCustom = JSON.stringify(localConfig) !== JSON.stringify(DEFAULT_LANDING_CMS);
    if (!isCustom) return null;

    const res = await fetch("/api/landing-cms", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && !json.data) {
        const saveRes = await saveLandingCMSToServer(localConfig);
        if (saveRes.success) {
          return localConfig;
        }
      }
    }
  } catch (err) {
    console.error("[CMS MIGRATION ERROR]", err);
  }
  return null;
}

export async function saveLandingCMSToServer(config: LandingCMSConfig): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== "undefined") {
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event("tbs_landing_cms_updated"));
  }

  try {
    const res = await fetch("/api/landing-cms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "HTTP Error " + res.status);
      return { success: false, error: `Máy chủ phản hồi lỗi (${res.status}): ${errText}` };
    }

    const data = await res.json().catch(() => ({}));
    if (data && data.success) {
      return { success: true };
    }
    return { success: false, error: data?.error || "Máy chủ không xác nhận được dữ liệu" };
  } catch (err: any) {
    return { success: false, error: err?.message || "Lỗi kết nối mạng khi gửi lên máy chủ" };
  }
}

export function saveLandingCMS(config: LandingCMSConfig) {
  saveLandingCMSToServer(config);
}
