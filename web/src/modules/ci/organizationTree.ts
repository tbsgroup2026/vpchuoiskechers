/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * CENTRALIZED ORGANIZATION TREE MAPPING (CẤU TRÚC PHÂN CẤP NHÀ MÁY → XƯỞNG → LINE → CHUYỀN → TỔ)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Single Source of Truth for 5-Level Cascading Organizational Filter.
 * Easily updateable when PO / User provides full organizational hierarchy.
 */

export interface OrgNodeMap {
  [factoryName: string]: {
    [workshopName: string]: {
      [lineName: string]: {
        [chuyenName: string]: string[]; // Array of Tổ names
      } | string[]; // Fallback array if no further sub-levels
    } | string[];
  } | string[];
}

export const KIEN_GIANG_FACTORIES = [
  "Nhà Máy Miền Đông",
  "Kiên Giang 1",
  "Kiên Giang 2",
  "Kiên Giang 3",
  "Hoàn Thiện Đế",
  "Văn Phòng Chuỗi",
];

export function isKienGiangFactory(factory: string): boolean {
  if (!factory) return true;
  const normalized = factory.trim().toLowerCase();
  return (
    normalized.includes("kiên giang") ||
    normalized.includes("kg") ||
    normalized.includes("hoàn thiện đế") ||
    normalized.includes("htđ") ||
    normalized.includes("miền đông") ||
    normalized.includes("nmmđ") ||
    normalized.includes("văn phòng") ||
    normalized.includes("vp")
  );
}

const STANDARD_WORKSHOPS = {
  "Đầu Vào": {
    "Line 1": ["Tổ 1", "Tổ 2"],
    "Line 2": ["Tổ 1", "Tổ 2"],
    "Line 3": ["Tổ 1", "Tổ 2"],
  },
  "May": {
    "Line 1": ["Tổ 1", "Tổ 2"],
    "Line 2": ["Tổ 1", "Tổ 2"],
    "Line 3": ["Tổ 1", "Tổ 2"],
  },
  "Gò": {
    "Line 1": ["Tổ 1", "Tổ 2"],
    "Line 2": ["Tổ 1", "Tổ 2"],
    "Line 3": ["Tổ 1", "Tổ 2"],
  },
  // Legacy aliases mapping to same structure
  "Xưởng Đế": {
    "Line 1": ["Tổ 1", "Tổ 2"],
    "Line 2": ["Tổ 1", "Tổ 2"],
    "Line 3": ["Tổ 1", "Tổ 2"],
  },
  "Xưởng Mũi": {
    "Line 1": ["Tổ 1", "Tổ 2"],
    "Line 2": ["Tổ 1", "Tổ 2"],
    "Line 3": ["Tổ 1", "Tổ 2"],
  },
  "Xưởng Gò": {
    "Line 1": ["Tổ 1", "Tổ 2"],
    "Line 2": ["Tổ 1", "Tổ 2"],
    "Line 3": ["Tổ 1", "Tổ 2"],
  },
};

const VP_WORKSHOPS = {
  "Văn phòng": {
    "Line 1": ["Tổ 1"],
  },
  ...STANDARD_WORKSHOPS,
};

export const INITIAL_ORG_TREE: OrgNodeMap = {
  "Nhà Máy Miền Đông": STANDARD_WORKSHOPS,
  "NMMĐ": STANDARD_WORKSHOPS,
  "Kiên Giang 1": STANDARD_WORKSHOPS,
  "Nhà máy Kiên Giang 1": STANDARD_WORKSHOPS,
  "Kiên Giang 2": STANDARD_WORKSHOPS,
  "Nhà máy Kiên Giang 2": STANDARD_WORKSHOPS,
  "Kiên Giang 3": STANDARD_WORKSHOPS,
  "Nhà máy Kiên Giang 3": STANDARD_WORKSHOPS,
  "Hoàn Thiện Đế": STANDARD_WORKSHOPS,
  "Văn Phòng Chuỗi": VP_WORKSHOPS,
  "Văn phòng Chuỗi Supply Chain": VP_WORKSHOPS,
  "VP Chuỗi": VP_WORKSHOPS,
};

/**
 * Helper to retrieve grouped workshops for selected factories
 */
export function getWorkshopsForFactories(selectedFactories: string[], tree: OrgNodeMap = INITIAL_ORG_TREE) {
  const result: { factory: string; workshops: string[] }[] = [];
  selectedFactories.forEach((factory) => {
    const fNode = tree[factory];
    if (fNode && typeof fNode === "object" && !Array.isArray(fNode)) {
      result.push({
        factory,
        workshops: Object.keys(fNode),
      });
    } else if (Array.isArray(fNode)) {
      result.push({ factory, workshops: fNode });
    }
  });
  return result;
}

/**
 * Helper to retrieve grouped lines for selected workshops
 */
export function getLinesForWorkshops(selectedFactories: string[], selectedWorkshops: string[], tree: OrgNodeMap = INITIAL_ORG_TREE) {
  const result: { workshop: string; lines: string[] }[] = [];
  selectedFactories.forEach((factory) => {
    const fNode = tree[factory];
    if (fNode && typeof fNode === "object" && !Array.isArray(fNode)) {
      selectedWorkshops.forEach((ws) => {
        const wsNode = fNode[ws];
        if (wsNode) {
          if (typeof wsNode === "object" && !Array.isArray(wsNode)) {
            result.push({ workshop: ws, lines: Object.keys(wsNode) });
          } else if (Array.isArray(wsNode)) {
            result.push({ workshop: ws, lines: wsNode });
          }
        }
      });
    }
  });
  return result;
}

/**
 * Helper to retrieve grouped chuyens for selected lines
 */
export function getChuyensForLines(
  selectedFactories: string[],
  selectedWorkshops: string[],
  selectedLines: string[],
  tree: OrgNodeMap = INITIAL_ORG_TREE
) {
  const result: { line: string; chuyens: string[] }[] = [];
  selectedFactories.forEach((factory) => {
    const fNode = tree[factory];
    if (fNode && typeof fNode === "object" && !Array.isArray(fNode)) {
      selectedWorkshops.forEach((ws) => {
        const wsNode = fNode[ws];
        if (wsNode && typeof wsNode === "object" && !Array.isArray(wsNode)) {
          selectedLines.forEach((ln) => {
            const lineNode = wsNode[ln];
            if (lineNode) {
              if (typeof lineNode === "object" && !Array.isArray(lineNode)) {
                result.push({ line: ln, chuyens: Object.keys(lineNode) });
              } else if (Array.isArray(lineNode)) {
                result.push({ line: ln, chuyens: lineNode });
              }
            }
          });
        }
      });
    }
  });
  return result;
}

/**
 * Helper to retrieve grouped tos for selected chuyens
 */
export function getTosForChuyens(
  selectedFactories: string[],
  selectedWorkshops: string[],
  selectedLines: string[],
  selectedChuyens: string[],
  tree: OrgNodeMap = INITIAL_ORG_TREE
) {
  const result: { chuyen: string; tos: string[] }[] = [];
  selectedFactories.forEach((factory) => {
    const fNode = tree[factory];
    if (fNode && typeof fNode === "object" && !Array.isArray(fNode)) {
      selectedWorkshops.forEach((ws) => {
        const wsNode = fNode[ws];
        if (wsNode && typeof wsNode === "object" && !Array.isArray(wsNode)) {
          selectedLines.forEach((ln) => {
            const lineNode = wsNode[ln];
            if (lineNode && typeof lineNode === "object" && !Array.isArray(lineNode)) {
              selectedChuyens.forEach((ch) => {
                const chuyenNode = lineNode[ch];
                if (chuyenNode && Array.isArray(chuyenNode)) {
                  result.push({ chuyen: ch, tos: chuyenNode });
                }
              });
            }
          });
        }
      });
    }
  });
  return result;
}
