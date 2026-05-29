export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

export type ClothingSize = (typeof CLOTHING_SIZES)[number];
