export type Category = "Nature" | "Portrait" | "Street" | "Architecture";

export interface Photo {
  id: string;
  src: string;
  title: string;
  description: string;
  category: Category;
  location: string;
  camera: string;
}

// Static seed photos removed — all photos are now fetched from Firebase Firestore.
export const photos: Photo[] = [];

export const categories: ("All" | Category)[] = [
  "All",
  "Nature",
  "Portrait",
  "Street",
  "Architecture",
];
