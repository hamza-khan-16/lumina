import { supabase } from "./supabase";
import type { Photo } from "@/data/galleryData";

const TABLE = "photos";
const BUCKET = "photos";

// ─── Fetch all photos from Supabase (newest first) ──────────────────────────
export async function fetchPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    src: row.src,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    camera: row.camera,
  })) as Photo[];
}

// ─── Upload image to Storage, then insert metadata row ──────────────────────
export async function uploadPhoto(
  file: File,
  meta: Omit<Photo, "id" | "src">,
  onProgress?: (pct: number) => void
): Promise<Photo> {
  // 1. Upload file to Supabase Storage
  const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase();
  const filePath = `${Date.now()}_${safeName}`;

  // Supabase JS v2 doesn't expose upload progress natively,
  // so we fake a quick ramp to 90% then jump to 100% on completion.
  const progressInterval = simulateProgress(onProgress);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: false });

  clearInterval(progressInterval);
  onProgress?.(100);

  if (uploadError) throw new Error(uploadError.message);

  // 2. Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  const src = urlData.publicUrl;

  // 3. Insert metadata row into Firestore
  const { data, error: insertError } = await supabase
    .from(TABLE)
    .insert([{ src, ...meta }])
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);

  return {
    id: String(data.id),
    src: data.src,
    title: data.title,
    description: data.description,
    category: data.category,
    location: data.location,
    camera: data.camera,
  } as Photo;
}

// ─── Fake upload progress (Supabase v2 doesn't support XHR progress) ────────
function simulateProgress(cb?: (pct: number) => void): ReturnType<typeof setInterval> {
  let pct = 0;
  return setInterval(() => {
    pct = Math.min(pct + Math.random() * 15, 90);
    cb?.(Math.round(pct));
  }, 300);
}

// ─── Delete photo: removes Storage file + Firestore row ─────────────────────
export async function deletePhoto(photo: Photo): Promise<void> {
  // Extract storage file path from the public URL
  // URL format: https://<project>.supabase.co/storage/v1/object/public/photos/<filePath>
  const url = new URL(photo.src);
  const pathParts = url.pathname.split("/public/photos/");
  const filePath = pathParts[1];

  if (filePath) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([filePath]);
    if (storageError) console.warn("Storage delete warning:", storageError.message);
  }

  const { error: dbError } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", photo.id);

  if (dbError) throw new Error(dbError.message);
}