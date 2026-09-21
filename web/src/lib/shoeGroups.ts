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

export const DEFAULT_SHOE_GROUPS: ShoeGroup[] = [
  {
    id: "sg-1",
    title: "WATER PROOF",
    order: 1,
    items: [
      { id: "img-1-1", url: "/images/brands/WATER PROOF/1.png", name: "Waterproof Hiking Boot", order: 1 },
      { id: "img-1-2", url: "/images/brands/WATER PROOF/2.jpg", name: "Waterproof Safety Shoe", order: 2 },
      { id: "img-1-3", url: "/images/brands/WATER PROOF/3.png", name: "All-Terrain Waterproof", order: 3 },
      { id: "img-1-4", url: "/images/brands/WATER PROOF/4.png", name: "Waterproof Trail Boot", order: 4 },
      { id: "img-1-5", url: "/images/brands/WATER PROOF/5.jpg", name: "Waterproof Leather Work", order: 5 },
    ],
  },
  {
    id: "sg-2",
    title: "MEN'S SPORT",
    order: 2,
    items: [
      { id: "img-2-1", url: "/images/brands/MEN'S SPORT/1.jpg", name: "Sport Lifestyle Sneaker", order: 1 },
      { id: "img-2-2", url: "/images/brands/MEN'S SPORT/2.jpg", name: "Athletic Runner Max", order: 2 },
      { id: "img-2-3", url: "/images/brands/MEN'S SPORT/3.jpg", name: "Sport Comfort Trainer", order: 3 },
      { id: "img-2-4", url: "/images/brands/MEN'S SPORT/4.png", name: "Sport Mesh Slip-On", order: 4 },
      { id: "img-2-5", url: "/images/brands/MEN'S SPORT/5.jpg", name: "Sport Performance Runner", order: 5 },
    ],
  },
  {
    id: "sg-3",
    title: "MEN USA",
    order: 3,
    items: [
      { id: "img-3-1", url: "/images/brands/MEN USA/1.jpg", name: "USA Classic Outdoor", order: 1 },
      { id: "img-3-2", url: "/images/brands/MEN USA/2.png", name: "USA Leather Chelsea", order: 2 },
      { id: "img-3-3", url: "/images/brands/MEN USA/3.png", name: "USA Heritage Work Boot", order: 3 },
      { id: "img-3-4", url: "/images/brands/MEN USA/4.jpg", name: "USA All-Weather Boot", order: 4 },
      { id: "img-3-5", url: "/images/brands/MEN USA/5.jpg", name: "USA Steel Toe Master", order: 5 },
    ],
  },
  {
    id: "sg-4",
    title: "WORK SHOES",
    order: 4,
    items: [
      { id: "img-4-1", url: "/images/brands/WORK SHOES/1.jpg", name: "Steel Toe Work Safety", order: 1 },
      { id: "img-4-2", url: "/images/brands/WORK SHOES/2.jpg", name: "Industrial Comfort Work", order: 2 },
      { id: "img-4-3", url: "/images/brands/WORK SHOES/3.jpg", name: "Heavy Duty Work Shoe", order: 3 },
      { id: "img-4-4", url: "/images/brands/WORK SHOES/4.png", name: "Heavy Duty Leather Boot", order: 4 },
      { id: "img-4-5", url: "/images/brands/WORK SHOES/5.png", name: "Safety Grip Professional", order: 5 },
    ],
  },
  {
    id: "sg-5",
    title: "PERFORMANCE",
    order: 5,
    items: [
      { id: "img-5-1", url: "/images/brands/PERFORMANCE/1.jpg", name: "Performance GoRun Pro", order: 1 },
      { id: "img-5-2", url: "/images/brands/PERFORMANCE/2.png", name: "Performance Speed Elite", order: 2 },
      { id: "img-5-3", url: "/images/brands/PERFORMANCE/3.png", name: "Performance Trail Burst", order: 3 },
      { id: "img-5-4", url: "/images/brands/PERFORMANCE/4.jpg", name: "Performance Energy Max", order: 4 },
      { id: "img-5-5", url: "/images/brands/PERFORMANCE/5.png", name: "Performance Dynamic Flex", order: 5 },
    ],
  },
];
