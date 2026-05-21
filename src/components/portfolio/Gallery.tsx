import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { categories, type Photo } from "@/data/galleryData";
import { fetchPhotos } from "@/lib/photoService";
import SectionHeading from "./SectionHeading";
import Lightbox from "./Lightbox";

export const Gallery = () => {
  const [filter, setFilter] = useState<(typeof categories)[number]>("All");
  const [active, setActive] = useState<Photo | null>(null);
  const [firebasePhotos, setFirebasePhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const photos = await fetchPhotos();
      setFirebasePhotos(photos);
    } catch (e) {
      console.error(e);
      setError("Could not load photos from Supabase. Check your configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const all = useMemo(() => firebasePhotos, [firebasePhotos]);

  const filtered = useMemo(
    () => (filter === "All" ? all : all.filter((p) => p.category === filter)),
    [filter, all]
  );

  const idx = active ? filtered.findIndex((p) => p.id === active.id) : -1;
  const prev = () => idx > 0 && setActive(filtered[idx - 1]);
  const next = () => idx >= 0 && idx < filtered.length - 1 && setActive(filtered[idx + 1]);

  return (
    <section id="gallery" className="relative py-24 md:py-32">
      <div className="container-x">
        <SectionHeading
          eyebrow="Selected Works"
          title="A gallery of moments, frozen in time."
          description="Browse by category. Click any frame for the full story behind the shot."
        />

        {/* Category filters */}
        <div className="mb-10 flex flex-wrap gap-2">
          {categories.map((c) => {
            const isActive = filter === c;
            return (
              <button key={c} onClick={() => setFilter(c)}
                className={`relative rounded-full px-5 py-2 text-sm transition-colors ${
                  isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {isActive && (
                  <motion.span layoutId="filter-pill"
                    className="absolute inset-0 rounded-full bg-gradient-primary shadow-elegant"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                )}
                <span className="relative z-10">{c}</span>
              </button>
            );
          })}

          {/* Refresh button */}
          <button onClick={load} title="Reload from Supabase"
            className="ml-auto flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-primary/40 transition">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading photos from Supabase…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <button onClick={load}
              className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/20 hover:bg-destructive/30 px-4 py-2 text-xs transition">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <p className="py-24 text-center text-sm text-muted-foreground">
            No photos yet. Add some via the admin panel.
          </p>
        )}

        {/* Masonry grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
            <AnimatePresence>
              {filtered.map((p, i) => (
                <motion.button key={p.id} layout
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
                  onClick={() => setActive(p)}
                  className="group relative mb-5 block w-full overflow-hidden rounded-2xl bg-card text-left break-inside-avoid shadow-soft">
                  <img src={p.src} alt={p.title} loading="lazy"
                    className="w-full h-auto transition-all duration-700 ease-out group-hover:scale-[1.06] group-hover:blur-[2px]" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 p-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-primary-glow">{p.category}</span>
                    <h3 className="heading mt-1 text-xl font-bold">{p.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Lightbox photo={active} onClose={() => setActive(null)}
        onPrev={idx > 0 ? prev : undefined}
        onNext={idx >= 0 && idx < filtered.length - 1 ? next : undefined} />
    </section>
  );
};

export default Gallery;
