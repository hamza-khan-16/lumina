import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, ImagePlus, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Category, Photo } from "@/data/galleryData";
import { categories } from "@/data/galleryData";
import SectionHeading from "./SectionHeading";
import { uploadPhoto } from "@/lib/photoService";

interface Pending {
  id: string;
  file: File;
  preview: string;
  title: string;
  description: string;
  category: Category;
  location: string;
  camera: string;
  progress: number;
  uploading: boolean;
}

const CATEGORY_OPTIONS = categories.filter((c) => c !== "All") as Category[];

interface Props {
  onAdd: (p: Photo) => void;
}

export const UploadSection = ({ onAdd }: Props) => {
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) { toast.error("Please select image files only."); return; }
    const next: Pending[] = list.slice(0, 8).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, "").slice(0, 60),
      description: "",
      category: "Nature" as Category,
      location: "",
      camera: "",
      progress: 0,
      uploading: false,
    }));
    setPending((p) => [...next, ...p]);
  }, []);

  const remove = (id: string) =>
    setPending((p) => {
      const found = p.find((x) => x.id === id);
      if (found) URL.revokeObjectURL(found.preview);
      return p.filter((x) => x.id !== id);
    });

  const update = (id: string, patch: Partial<Pending>) =>
    setPending((arr) => arr.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const publish = async (item: Pending) => {
    if (!item.title.trim()) { toast.error("Please add a title before publishing."); return; }
    update(item.id, { uploading: true, progress: 0 });
    try {
      const photo = await uploadPhoto(
        item.file,
        {
          title: item.title.trim(),
          description: item.description.trim() || "Uploaded to the gallery.",
          category: item.category,
          location: item.location.trim() || "Unknown location",
          camera: item.camera.trim() || "Unknown camera",
        },
        (pct) => update(item.id, { progress: pct })
      );
      onAdd(photo);
      setPending((p) => {
        const found = p.find((x) => x.id === item.id);
        if (found) URL.revokeObjectURL(found.preview);
        return p.filter((x) => x.id !== item.id);
      });
      toast.success("Photo published to the gallery ✨");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed — check your Firebase config and try again.");
      update(item.id, { uploading: false, progress: 0 });
    }
  };

  return (
    <section id="upload" className="relative py-24 md:py-32">
      <div className="container-x">
        <SectionHeading
          eyebrow="Your archive"
          title="Upload your own moments."
          description="Drop image files below, fill in the details, then publish them straight into the live gallery — stored permanently in Firebase."
        />

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center transition-all ${
            dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border glass hover:border-primary/60"
          }`}
        >
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary shadow-elegant">
            <UploadCloud className="h-7 w-7 text-primary-foreground" />
          </div>
          <h3 className="heading mt-5 text-xl font-bold">Drag & drop, or click to browse</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            JPG, PNG or WEBP — up to 8 files. Uploaded directly to Firebase Storage.
          </p>
        </div>

        <AnimatePresence>
          {pending.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pending.map((p) => (
                <motion.div layout key={p.id}
                  initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
                  className="relative overflow-hidden rounded-2xl glass shadow-soft flex flex-col">
                  <div className="relative">
                    <img src={p.preview} alt={p.title} className="aspect-[4/3] w-full object-cover" />
                    {p.uploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <span className="text-sm font-medium">{p.progress}%</span>
                        <div className="mt-2 w-32 h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full bg-gradient-primary transition-all duration-200" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                    )}
                    {!p.uploading && (
                      <button aria-label="Remove" onClick={() => remove(p.id)}
                        className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-background/70 backdrop-blur hover:bg-destructive hover:text-destructive-foreground transition">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5 p-4">
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Title *</label>
                      <input disabled={p.uploading} value={p.title}
                        onChange={(e) => update(p.id, { title: e.target.value.slice(0, 80) })}
                        placeholder="e.g. Golden Hour"
                        className="w-full rounded-lg bg-secondary px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Description</label>
                      <textarea disabled={p.uploading} value={p.description}
                        onChange={(e) => update(p.id, { description: e.target.value.slice(0, 300) })}
                        placeholder="A few words about this shot…" rows={2}
                        className="w-full resize-none rounded-lg bg-secondary px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Category</label>
                      <select disabled={p.uploading} value={p.category}
                        onChange={(e) => update(p.id, { category: e.target.value as Category })}
                        className="w-full rounded-lg bg-secondary px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary disabled:opacity-50">
                        {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Location</label>
                        <input disabled={p.uploading} value={p.location}
                          onChange={(e) => update(p.id, { location: e.target.value.slice(0, 60) })}
                          placeholder="Paris, France"
                          className="w-full rounded-lg bg-secondary px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Camera</label>
                        <input disabled={p.uploading} value={p.camera}
                          onChange={(e) => update(p.id, { camera: e.target.value.slice(0, 60) })}
                          placeholder="Sony A7 IV"
                          className="w-full rounded-lg bg-secondary px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
                      </div>
                    </div>
                    <button disabled={p.uploading} onClick={() => publish(p)}
                      className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-primary px-3 py-2.5 text-xs font-medium text-primary-foreground hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:scale-100">
                      {p.uploading
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
                        : <><Check className="h-3.5 w-3.5" /> Publish to Gallery</>}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {pending.length === 0 && (
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ImagePlus className="h-3.5 w-3.5" /> No files yet — your previews will appear here.
          </p>
        )}
      </div>
    </section>
  );
};

export default UploadSection;
