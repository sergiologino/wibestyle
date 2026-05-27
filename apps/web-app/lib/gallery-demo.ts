import type { GalleryPost } from "@wibestyle/shared-types";

export const demoGalleryPosts: GalleryPost[] = [
  {
    id: "post_1",
    slug: "summer-dress-anna",
    title: "Летнее платье · Аня",
    imageUrl: "/assets/demo-after.svg",
    likeCount: 42,
    commentCount: 6,
    visibility: "public",
    productLinkVisible: true,
  },
  {
    id: "post_2",
    slug: "office-blazer-kate",
    title: "Офисный пиджак · Катя",
    imageUrl: "/assets/demo-garment.svg",
    likeCount: 28,
    commentCount: 3,
    visibility: "unlisted",
    productLinkVisible: false,
  },
];
