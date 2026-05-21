import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, UploadCloud, Trash2, X, Check, Loader2, ImagePlus,
  LayoutDashboard, Images, Eye, Camera, RefreshCw, ShieldCheck, Menu,
} from "lucide-react";
import { toast } from "sonner";
import { adminLogin, adminLogout, isAdminLoggedIn } from "@/lib/adminAuth";
import { fetchPhotos, uploadPhoto, deletePhoto } from "@/lib/photoService";
import type { Category, Photo } from "@/data/galleryData";
import { categories } from "@/data/galleryData";

const CATEGORY_OPTIONS = categories.filter((c) => c !== "All") as Category[];

/* ─── Login Screen ───────────────────────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (adminLogin(user, pass)) {
        onLogin();
      } else {
        setErr("Invalid username or password.");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-500/30">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="mt-1 text-sm text-white/40">Lumina Gallery · Management Panel</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-widest text-white/40">Username</label>
            <input
              value={user} onChange={e => setUser(e.target.value)} autoComplete="username"
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition placeholder:text-white/20"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-widest text-white/40">Password</label>
            <input
              type="password" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password"
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition placeholder:text-white/20"
              placeholder="••••••••"
            />
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {loading ? "Verifying…" : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-white/20">This page is not linked from the public site.</p>
      </motion.div>
    </div>
  );
}

/* ─── Pending Upload Card ────────────────────────────────────────────────── */
interface Pending {
  id: string; file: File; preview: string;
  title: string; description: string; category: Category;
  location: string; camera: string; progress: number; uploading: boolean;
}

function UploadCard({ p, onRemove, onUpdate, onPublish }: {
  p: Pending;
  onRemove: () => void;
  onUpdate: (patch: Partial<Pending>) => void;
  onPublish: () => void;
}) {
  return (
    <motion.div layout key={p.id}
      initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur flex flex-col">
      <div className="relative">
        <img src={p.preview} alt={p.title} className="aspect-[4/3] w-full object-cover" />
        {p.uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400 mb-2" />
            <span className="text-sm font-medium text-white">{p.progress}%</span>
            <div className="mt-2 w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all" style={{ width: `${p.progress}%` }} />
            </div>
          </div>
        )}
        {!p.uploading && (
          <button onClick={onRemove}
            className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 hover:bg-red-500/80 transition">
            <X className="h-4 w-4 text-white" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        {[
          { label: "Title *", key: "title", placeholder: "e.g. Golden Hour", max: 80 },
          { label: "Description", key: "description", placeholder: "A few words…", max: 300 },
          { label: "Location", key: "location", placeholder: "Paris, France", max: 60 },
          { label: "Camera", key: "camera", placeholder: "Sony A7 IV", max: 60 },
        ].map(({ label, key, placeholder, max }) => (
          <div key={key}>
            <label className="mb-1 block text-[9px] uppercase tracking-widest text-white/30">{label}</label>
            {key === "description" ? (
              <textarea disabled={p.uploading} value={(p as any)[key]}
                onChange={e => onUpdate({ [key]: e.target.value.slice(0, max) })}
                placeholder={placeholder} rows={2}
                className="w-full resize-none rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-violet-500 transition placeholder:text-white/20 disabled:opacity-40" />
            ) : (
              <input disabled={p.uploading} value={(p as any)[key]}
                onChange={e => onUpdate({ [key]: e.target.value.slice(0, max) })}
                placeholder={placeholder}
                className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-violet-500 transition placeholder:text-white/20 disabled:opacity-40" />
            )}
          </div>
        ))}
        <div>
          <label className="mb-1 block text-[9px] uppercase tracking-widest text-white/30">Category</label>
          <select disabled={p.uploading} value={p.category}
            onChange={e => onUpdate({ category: e.target.value as Category })}
            className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-violet-500 transition disabled:opacity-40">
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
          </select>
        </div>
        <button disabled={p.uploading} onClick={onPublish}
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-2.5 text-xs font-medium text-white hover:opacity-90 transition disabled:opacity-50">
          {p.uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</> : <><Check className="h-3.5 w-3.5" /> Publish</>}
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Dashboard Panel ────────────────────────────────────────────────────── */
function Dashboard({ photos, onRefresh }: { photos: Photo[]; onRefresh: () => void }) {
  const byCategory = CATEGORY_OPTIONS.map(cat => ({
    cat, count: photos.filter(p => p.category === cat).length,
  }));
  const max = Math.max(...byCategory.map(b => b.count), 1);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Photos", value: photos.length, icon: Images, color: "from-violet-600 to-blue-600" },
          { label: "Categories", value: CATEGORY_OPTIONS.length, icon: LayoutDashboard, color: "from-blue-600 to-cyan-600" },
          { label: "Latest Upload", value: photos[0]?.title?.slice(0, 12) || "—", icon: Camera, color: "from-pink-600 to-violet-600" },
          { label: "Storage Used", value: `~${Math.round(photos.length * 0.8)} MB`, icon: Eye, color: "from-emerald-600 to-blue-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
            <div className={`mb-3 inline-grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-white truncate">{value}</p>
            <p className="mt-0.5 text-xs text-white/40">{label}</p>
          </div>
        ))}
      </div>

      {/* Category bar chart */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
        <h3 className="mb-4 text-sm font-semibold text-white/70 uppercase tracking-widest">Photos by Category</h3>
        <div className="space-y-3">
          {byCategory.map(({ cat, count }) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="w-20 md:w-24 text-xs text-white/50 shrink-0">{cat}</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / max) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                />
              </div>
              <span className="w-6 text-right text-xs font-medium text-white/60 shrink-0">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent uploads */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
        <h3 className="mb-4 text-sm font-semibold text-white/70 uppercase tracking-widest">Recent Uploads</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
          {photos.slice(0, 12).map(p => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-white/10 aspect-square">
              <img src={p.src} alt={p.title} className="w-full h-full object-cover" />
            </div>
          ))}
          {photos.length === 0 && <p className="col-span-full text-xs text-white/30">No photos yet.</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── Manage Photos Panel ────────────────────────────────────────────────── */
function ManagePhotos({ photos, onDeleted }: { photos: Photo[]; onDeleted: (id: string) => void }) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = async (photo: Photo) => {
    setDeleting(photo.id);
    try {
      await deletePhoto(photo);
      onDeleted(photo.id);
      toast.success(`"${photo.title}" removed.`);
    } catch (e: any) {
      toast.error("Delete failed: " + e.message);
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  };

  return (
    <div>
      <p className="mb-5 text-sm text-white/40">{photos.length} photo{photos.length !== 1 ? "s" : ""} in the gallery.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {photos.map(photo => (
            <motion.div key={photo.id} layout
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 group">
              <img src={photo.src} alt={photo.title} className="aspect-[4/3] w-full object-cover transition group-hover:scale-105 duration-500" />
              <div className="p-3">
                <p className="text-xs font-medium text-white truncate">{photo.title}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{photo.category} · {photo.location}</p>
              </div>

              <AnimatePresence>
                {confirmId === photo.id && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 backdrop-blur p-4 text-center">
                    <Trash2 className="h-7 w-7 text-red-400" />
                    <p className="text-xs text-white/80 leading-snug">Delete <strong>"{photo.title}"</strong>?<br/>This removes it from the database and storage.</p>
                    <div className="flex gap-2 w-full">
                      <button onClick={() => setConfirmId(null)}
                        className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-white/60 hover:bg-white/10 transition">
                        Cancel
                      </button>
                      <button onClick={() => handleDelete(photo)} disabled={deleting === photo.id}
                        className="flex-1 rounded-lg bg-red-500/80 hover:bg-red-500 py-2 text-xs text-white font-medium transition flex items-center justify-center gap-1 disabled:opacity-60">
                        {deleting === photo.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {confirmId !== photo.id && (
                <button onClick={() => setConfirmId(photo.id)}
                  className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition hover:bg-red-500/80">
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {photos.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-white/30">No photos yet.</p>
        )}
      </div>
    </div>
  );
}

/* ─── Upload Panel ───────────────────────────────────────────────────────── */
function UploadPanel({ onAdd }: { onAdd: (p: Photo) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!list.length) { toast.error("Image files only."); return; }
    const next: Pending[] = list.slice(0, 8).map(file => ({
      id: crypto.randomUUID(), file, preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, "").slice(0, 60),
      description: "", category: "Nature" as Category,
      location: "", camera: "", progress: 0, uploading: false,
    }));
    setPending(p => [...next, ...p]);
  }, []);

  const remove = (id: string) => setPending(p => {
    URL.revokeObjectURL(p.find(x => x.id === id)?.preview ?? "");
    return p.filter(x => x.id !== id);
  });

  const update = (id: string, patch: Partial<Pending>) =>
    setPending(arr => arr.map(x => x.id === id ? { ...x, ...patch } : x));

  const publish = async (item: Pending) => {
    if (!item.title.trim()) { toast.error("Add a title first."); return; }
    update(item.id, { uploading: true, progress: 0 });
    try {
      const photo = await uploadPhoto(
        item.file,
        { title: item.title.trim(), description: item.description.trim() || "Uploaded to the gallery.",
          category: item.category, location: item.location.trim() || "Unknown location",
          camera: item.camera.trim() || "Unknown camera" },
        pct => update(item.id, { progress: pct })
      );
      onAdd(photo);
      setPending(p => { URL.revokeObjectURL(p.find(x => x.id === item.id)?.preview ?? ""); return p.filter(x => x.id !== item.id); });
      toast.success("Photo published ✨");
    } catch (e: any) {
      toast.error("Upload failed: " + e.message);
      update(item.id, { uploading: false, progress: 0 });
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 md:p-12 text-center transition-all ${
          dragOver ? "border-violet-500 bg-violet-500/5 scale-[1.01]" : "border-white/10 hover:border-violet-500/50 bg-white/5"
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)} />
        <div className="grid h-14 w-14 md:h-16 md:w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-500/30">
          <UploadCloud className="h-6 w-6 md:h-7 md:w-7 text-white" />
        </div>
        <h3 className="mt-4 md:mt-5 text-base md:text-lg font-bold text-white">Drag & drop or click to browse</h3>
        <p className="mt-2 text-sm text-white/40">JPG, PNG, WEBP — up to 8 files at once</p>
      </div>

      <AnimatePresence>
        {pending.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pending.map(p => (
              <UploadCard key={p.id} p={p}
                onRemove={() => remove(p.id)}
                onUpdate={patch => update(p.id, patch)}
                onPublish={() => publish(p)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {pending.length === 0 && (
        <p className="flex items-center justify-center gap-2 text-xs text-white/20">
          <ImagePlus className="h-3.5 w-3.5" /> No files staged yet
        </p>
      )}
    </div>
  );
}

/* ─── Sidebar Content (shared between desktop & mobile drawer) ───────────── */
type Tab = "dashboard" | "upload" | "manage";

function SidebarContent({
  tab, setTab, loadPhotos, handleLogout, onClose,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  loadPhotos: () => void;
  handleLogout: () => void;
  onClose?: () => void;
}) {
  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "upload", label: "Upload", icon: UploadCloud },
    { id: "manage", label: "Manage Photos", icon: Images },
  ];

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/8">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shrink-0">
          <Camera className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-none">LUMEN</p>
          <p className="text-[10px] text-white/30 mt-0.5">Admin Panel</p>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 transition text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); onClose?.(); }}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
              tab === id
                ? "bg-gradient-to-r from-violet-600/40 to-blue-600/20 text-white border border-violet-500/30"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/8 space-y-1">
        <button onClick={() => { loadPhotos(); onClose?.(); }}
          className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/40 hover:text-white hover:bg-white/5 transition">
          <RefreshCw className="h-4 w-4" /> Refresh Data
        </button>
        <a href="/" target="_blank"
          className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/40 hover:text-white hover:bg-white/5 transition">
          <Eye className="h-4 w-4" /> View Site
        </a>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </>
  );
}

/* ─── Admin Dashboard Page ───────────────────────────────────────────────── */
export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(isAdminLoggedIn());
  const [tab, setTab] = useState<Tab>("dashboard");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadPhotos = async () => {
    setLoadingPhotos(true);
    try { setPhotos(await fetchPhotos()); }
    catch (e: any) { toast.error("Failed to load photos: " + e.message); }
    finally { setLoadingPhotos(false); }
  };

  useEffect(() => { if (loggedIn) loadPhotos(); }, [loggedIn]);

  // Close sidebar when resizing to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setSidebarOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const handleLogout = () => { adminLogout(); setLoggedIn(false); };

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  const tabLabels: Record<Tab, string> = {
    dashboard: "Overview of your gallery",
    upload: "Add new photos to the gallery",
    manage: "Delete or review existing photos",
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white">

      {/* ── Desktop Sidebar (lg+) ─────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-60 border-r border-white/8 bg-white/5 backdrop-blur-xl flex-col z-40">
        <SidebarContent
          tab={tab} setTab={setTab}
          loadPhotos={loadPhotos} handleLogout={handleLogout}
        />
      </aside>

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 h-full w-60 border-r border-white/10 bg-[#0c0c14] flex flex-col z-50 lg:hidden"
            >
              <SidebarContent
                tab={tab} setTab={setTab}
                loadPhotos={loadPhotos} handleLogout={handleLogout}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="lg:ml-60 min-h-screen flex flex-col">

        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/8 bg-[#050508]/90 backdrop-blur-xl px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-none capitalize">{tab}</p>
            <p className="text-[10px] text-white/30 mt-0.5 truncate">{tabLabels[tab]}</p>
          </div>
          <button
            onClick={loadPhotos}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
            title="Refresh data"
          >
            {loadingPhotos
              ? <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
              : <RefreshCw className="h-4 w-4" />
            }
          </button>
        </div>

        {/* Page body */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">

          {/* Desktop page header */}
          <div className="hidden lg:flex mb-8 items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold capitalize">{tab}</h1>
              <p className="mt-1 text-sm text-white/40">{tabLabels[tab]}</p>
            </div>
            <button
              onClick={loadPhotos}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/10 transition shrink-0"
              title="Refresh data"
            >
              {loadingPhotos
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />
              }
              Refresh Data
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {tab === "dashboard" && <Dashboard photos={photos} onRefresh={loadPhotos} />}
              {tab === "upload" && (
                <UploadPanel onAdd={p => setPhotos(prev => [p, ...prev])} />
              )}
              {tab === "manage" && (
                <ManagePhotos
                  photos={photos}
                  onDeleted={id => setPhotos(prev => prev.filter(p => p.id !== id))}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}