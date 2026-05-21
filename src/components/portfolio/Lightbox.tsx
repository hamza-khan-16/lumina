import { AnimatePresence, motion } from "framer-motion";
import { X, MapPin, Camera as CameraIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import type { Photo } from "@/data/galleryData";

interface Props {
  photo: Photo | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export const Lightbox = ({ photo, onClose, onPrev, onNext }: Props) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    if (photo) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [photo, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-background/85 backdrop-blur-xl p-4 md:p-10"
          onClick={onClose}
        >
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute top-5 right-5 grid h-11 w-11 place-items-center rounded-full glass hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>

          {onPrev && (
           <button onClick={e => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 grid h-14 w-14 place-items-center rounded-full bg-white/8 hover:bg-violet-500/30 transition-all border border-white/10 backdrop-blur">
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
          )}
          {onNext && (
             <button onClick={e => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 grid h-14 w-14 place-items-center rounded-full bg-white/8 hover:bg-violet-500/30 transition-all border border-white/10 backdrop-blur">
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
          )}

          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl grid lg:grid-cols-[1fr_320px] gap-4 lg:gap-6"
          >
            <div className="overflow-hidden rounded-2xl bg-card shadow-elegant">
              <img src={photo.src} alt={photo.title} className="w-full h-auto max-h-[80vh] object-contain bg-black" />
            </div>
            <aside className="glass rounded-2xl p-6 flex flex-col gap-4">
              <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{photo.category}</span>
              <h3 className="heading text-2xl font-bold">{photo.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{photo.description}</p>
              <div className="mt-2 space-y-3 border-t border-border pt-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{photo.location}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><CameraIcon className="h-4 w-4" />{photo.camera}</div>
              </div>
            </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Lightbox;
