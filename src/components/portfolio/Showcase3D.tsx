import {
  Suspense, useRef, useMemo, useEffect, useState, useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, MapPin, Camera as CameraIcon,
  Maximize2, Grid3x3, RotateCcw,
} from "lucide-react";
import { fetchPhotos } from "@/lib/photoService";
import type { Photo } from "@/data/galleryData";
import SectionHeading from "./SectionHeading";

/* ─── Texture cache (safe, no throw) ───────────────────────────────────── */
const textureCache = new Map<string, THREE.Texture>();
function useSafeTexture(src: string) {
  const [tex, setTex] = useState<THREE.Texture | null>(() => textureCache.get(src) ?? null);
  useEffect(() => {
    if (textureCache.has(src)) { setTex(textureCache.get(src)!); return; }
    const loader = new THREE.TextureLoader();
    loader.load(src, (t) => { textureCache.set(src, t); setTex(t); }, undefined, () => {});
  }, [src]);
  return tex;
}

/* ─── Animated fog / depth haze ────────────────────────────────────────── */
function DynamicFog() {
  const { scene } = useThree();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = 10 + Math.sin(t * 0.2) * 1.5;
      scene.fog.far = 28 + Math.cos(t * 0.15) * 2;
    }
  });
  return null;
}

/* ─── Instanced star field ──────────────────────────────────────────────── */
function StarField() {
  const ref = useRef<THREE.Points>(null);
  const count = 300;
  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 15 + Math.random() * 10;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4;
      pos[i * 3 + 2] = r * Math.cos(phi);
      sz[i] = Math.random() * 2 + 0.5;
    }
    return [pos, sz];
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.01;
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [positions, sizes]);

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.04} color="#c4b5fd" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

/* ─── Ambient floating orbs ─────────────────────────────────────────────── */
function FloatingOrbs() {
  const orbs = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      pos: [
        Math.sin((i / 6) * Math.PI * 2) * 7,
        Math.cos(i * 1.3) * 1.5,
        Math.cos((i / 6) * Math.PI * 2) * 7,
      ] as [number, number, number],
      color: ["#7c3aed", "#2563eb", "#db2777", "#0891b2", "#7c3aed", "#059669"][i],
      speed: 0.3 + i * 0.07,
      phase: i * 1.1,
      radius: 0.08 + Math.random() * 0.08,
    })), []);

  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    orbs.forEach((o, i) => {
      const m = refs.current[i];
      if (m) {
        m.position.y = o.pos[1] + Math.sin(t * o.speed + o.phase) * 0.8;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.6 + Math.sin(t * o.speed * 1.5 + o.phase) * 0.4;
      }
    });
  });

  return (
    <>
      {orbs.map((o, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} position={o.pos}>
          <sphereGeometry args={[o.radius, 12, 12]} />
          <meshStandardMaterial
            color={o.color} emissive={o.color} emissiveIntensity={0.8}
            transparent opacity={0.7} />
        </mesh>
      ))}
    </>
  );
}

/* ─── Reflective floor ──────────────────────────────────────────────────── */
function ReflectiveFloor() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.35 + Math.sin(clock.getElapsedTime() * 0.3) * 0.05;
    }
  });
  return (
    <>
      {/* Main floor */}
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#0a0520" metalness={0.9} roughness={0.1}
          transparent opacity={0.4} />
      </mesh>
      {/* Grid lines */}
      <gridHelper
        args={[30, 30, "#1e1b4b", "#0f0a2e"]}
        position={[0, -1.38, 0]}
      />
    </>
  );
}

/* ─── Cinematic photo frame ─────────────────────────────────────────────── */
function PhotoFrame({
  photo, position, rotation, isActive, isFocused,
  onSingleClick, onDoubleClick,
}: {
  photo: Photo;
  position: [number, number, number];
  rotation: [number, number, number];
  isActive: boolean;
  isFocused: boolean;
  onSingleClick: () => void;
  onDoubleClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const photoMeshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const texture = useSafeTexture(photo.src);

  // Double-click detection
  const lastClick = useRef(0);
  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastClick.current < 320) onDoubleClick();
    else onSingleClick();
    lastClick.current = now;
  }, [onSingleClick, onDoubleClick]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    const glow = glowRef.current;
    if (!g) return;
    const t = clock.getElapsedTime();

    // Gentle float
    g.position.y = position[1] + Math.sin(t * 0.5 + position[0]) * 0.12;

    // Scale towards active state
    const targetScale = isFocused ? 1.22 : isActive ? 1.1 : 1;
    g.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.07);

    // Glow pulse for active frame
    if (glow) {
      const mat = glow.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isActive
        ? 0.4 + Math.sin(t * 2) * 0.2
        : THREE.MathUtils.lerp(mat.emissiveIntensity, 0, 0.05);
      mat.opacity = isActive ? 0.15 + Math.sin(t * 2) * 0.05 : THREE.MathUtils.lerp(mat.opacity, 0, 0.05);
    }

    // Photo emissive lift
    if (photoMeshRef.current) {
      const mat = photoMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, isActive ? 0.15 : 0, 0.07);
    }
  });

  const W = 2.4, H = 1.68;

  return (
    <group ref={groupRef} position={position} rotation={rotation} onClick={handleClick}>
      {/* Glow aura behind frame */}
      <mesh ref={glowRef} position={[0, 0, -0.05]}>
        <planeGeometry args={[W + 0.8, H + 0.8]} />
        <meshStandardMaterial
          color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0}
          transparent opacity={0} side={THREE.FrontSide} />
      </mesh>

      {/* Deep shadow */}
      <mesh position={[0, -H / 2 - 0.15, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W * 0.8, 0.4]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.4} />
      </mesh>

      {/* Outer frame — dark metal */}
      <mesh position={[0, 0, -0.015]}>
        <planeGeometry args={[W + 0.22, H + 0.22]} />
        <meshStandardMaterial
          color={isActive ? "#4c1d95" : "#0f0a1e"}
          metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Mat board — subtle inner border */}
      <mesh position={[0, 0, -0.008]}>
        <planeGeometry args={[W + 0.1, H + 0.1]} />
        <meshStandardMaterial color={isActive ? "#1e1b4b" : "#0a0718"} />
      </mesh>

      {/* The photograph */}
      <mesh ref={photoMeshRef}>
        <planeGeometry args={[W, H]} />
        {texture ? (
          <meshStandardMaterial
            map={texture} toneMapped={false}
            emissive="#ffffff" emissiveIntensity={0}
            emissiveMap={texture} />
        ) : (
          <meshStandardMaterial color="#1e1b4b" emissive="#4c1d95" emissiveIntensity={0.2} />
        )}
      </mesh>

      {/* Corner pins — metallic */}
      {[[-W / 2 + 0.04, H / 2 - 0.04], [W / 2 - 0.04, H / 2 - 0.04],
        [-W / 2 + 0.04, -H / 2 + 0.04], [W / 2 - 0.04, -H / 2 + 0.04]].map(([cx, cy], ci) => (
        <mesh key={ci} position={[cx, cy, 0.012]}>
          <circleGeometry args={[0.035, 8]} />
          <meshStandardMaterial
            color={isActive ? "#a78bfa" : "#3730a3"}
            metalness={1} roughness={0.1}
            emissive={isActive ? "#7c3aed" : "#1e1b4b"}
            emissiveIntensity={isActive ? 1.5 : 0.3} />
        </mesh>
      ))}

      {/* Active indicator — glowing bottom edge */}
      {isActive && (
        <mesh position={[0, -H / 2 - 0.06, 0.01]}>
          <boxGeometry args={[W * 0.7, 0.015, 0.01]} />
          <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={3} />
        </mesh>
      )}
    </group>
  );
}

/* ─── Layout modes ──────────────────────────────────────────────────────── */
type LayoutMode = "carousel" | "grid";

function getCarouselLayout(index: number, total: number): {
  position: [number, number, number];
  rotation: [number, number, number];
} {
  const angle = (index / total) * Math.PI * 2;
  const radius = total <= 4 ? 3.5 : total <= 6 ? 4.2 : 5;
  return {
    position: [Math.sin(angle) * radius, 0, Math.cos(angle) * radius],
    rotation: [0, angle + Math.PI, 0],
  };
}

function getGridLayout(index: number, total: number): {
  position: [number, number, number];
  rotation: [number, number, number];
} {
  const cols = Math.min(total, 4);
  const row = Math.floor(index / cols);
  const col = index % cols;
  const totalCols = Math.min(total, cols);
  const spacingX = 3.0;
  const spacingY = 2.2;
  const offsetX = -(totalCols - 1) * spacingX * 0.5;
  const offsetY = -(Math.ceil(total / cols) - 1) * spacingY * 0.3;
  return {
    position: [offsetX + col * spacingX, offsetY + row * spacingY * 1 + 0.5, 1],
    rotation: [0, 0, 0],
  };
}

/* ─── Carousel ring ─────────────────────────────────────────────────────── */
function GlowRing({ radius }: { radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(clock.getElapsedTime() * 0.8) * 0.15;
      ref.current.rotation.z = clock.getElapsedTime() * 0.05;
    }
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius + 0.3, 0.02, 16, 120]} />
      <meshStandardMaterial
        color="#4c1d95" emissive="#7c3aed"
        emissiveIntensity={0.3} transparent opacity={0.6} />
    </mesh>
  );
}

/* ─── Main 3D Scene ─────────────────────────────────────────────────────── */
function Scene({
  photos, activeIndex, setActiveIndex, onPreview, mode,
}: {
  photos: Photo[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  onPreview: (p: Photo) => void;
  mode: LayoutMode;
}) {
  const carouselRef = useRef<THREE.Group>(null);
  const autoRotate = useRef(true);
  const rotY = useRef(0);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = useMemo(() => photos.slice(0, 10), [photos]);

  const layouts = useMemo(() =>
    items.map((_, i) =>
      mode === "carousel"
        ? getCarouselLayout(i, items.length)
        : getGridLayout(i, items.length)
    ), [items, mode]);

  const carouselRadius = items.length <= 4 ? 3.5 : items.length <= 6 ? 4.2 : 5;

  useFrame((_, delta) => {
    if (!carouselRef.current || mode === "grid") return;
    if (autoRotate.current) rotY.current += delta * 0.14;
    carouselRef.current.rotation.y = THREE.MathUtils.lerp(
      carouselRef.current.rotation.y, rotY.current, 0.04
    );
  });

  const pauseThenResume = () => {
    autoRotate.current = false;
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => { autoRotate.current = true; }, 4000);
  };

  return (
    <>
      <color attach="background" args={["#030108"]} />
      <fog attach="fog" args={["#030108", 12, 28]} />
      <DynamicFog />

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 8, 0]} intensity={3} color="#7c3aed" />
      <pointLight position={[8, 3, 8]} intensity={1.5} color="#1d4ed8" />
      <pointLight position={[-8, -1, -8]} intensity={1} color="#be185d" />
      <spotLight
        position={[0, 12, 2]} intensity={2} angle={0.5}
        penumbra={1} color="#ede9fe" />

      <StarField />
      <FloatingOrbs />
      <ReflectiveFloor />

      {mode === "carousel" && <GlowRing radius={carouselRadius} />}

      <group ref={mode === "carousel" ? carouselRef : undefined}>
        {items.map((p, i) => (
          <PhotoFrame
            key={p.id}
            photo={p}
            position={layouts[i].position}
            rotation={layouts[i].rotation}
            isActive={activeIndex === i}
            isFocused={false}
            onSingleClick={() => { setActiveIndex(i); pauseThenResume(); }}
            onDoubleClick={() => { setActiveIndex(i); onPreview(p); pauseThenResume(); }}
          />
        ))}
      </group>

      <Suspense fallback={null}>
        <Environment preset="night" />
      </Suspense>

      <OrbitControls
        enablePan={false} enableZoom
        minDistance={mode === "grid" ? 3 : 4}
        maxDistance={mode === "grid" ? 10 : 14}
        maxPolarAngle={Math.PI / 1.75}
        minPolarAngle={Math.PI / 5}
        dampingFactor={0.04} enableDamping
        autoRotate={false} />
    </>
  );
}

/* ─── Preview overlay ───────────────────────────────────────────────────── */
function PreviewOverlay({
  photo, all, onClose,
}: {
  photo: Photo; all: Photo[]; onClose: () => void;
}) {
  const [current, setCurrent] = useState(photo);
  const currentIdx = all.findIndex(p => p.id === current.id);
  const prev = currentIdx > 0 ? () => setCurrent(all[currentIdx - 1]) : undefined;
  const next = currentIdx < all.length - 1 ? () => setCurrent(all[currentIdx + 1]) : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev?.();
      if (e.key === "ArrowRight") next?.();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, prev, next]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-10"
      onClick={onClose}>

      {/* Close */}
      <button onClick={onClose}
        className="absolute top-5 right-5 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/8 hover:bg-white/20 transition-all border border-white/10 backdrop-blur">
        <X className="h-5 w-5 text-white" />
      </button>

      {/* Prev */}
      {prev && (
        <button onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 grid h-14 w-14 place-items-center rounded-full bg-white/8 hover:bg-violet-500/30 transition-all border border-white/10 backdrop-blur">
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Next */}
      {next && (
        <button onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 grid h-14 w-14 place-items-center rounded-full bg-white/8 hover:bg-violet-500/30 transition-all border border-white/10 backdrop-blur">
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-5xl grid lg:grid-cols-[1fr_280px] gap-4">

          {/* Image */}
          <div className="overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl">
            <img src={current.src} alt={current.title}
              className="w-full h-auto max-h-[75vh] object-contain" />
          </div>

          {/* Info panel */}
          <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-6 flex flex-col gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-violet-400 font-medium">{current.category}</span>
              <h3 className="mt-2 text-xl font-bold text-white leading-tight">{current.title}</h3>
              <p className="mt-3 text-sm text-white/55 leading-relaxed">{current.description}</p>
            </div>

            <div className="mt-auto space-y-3 border-t border-white/8 pt-4">
              <div className="flex items-center gap-2.5 text-sm text-white/40">
                <MapPin className="h-4 w-4 text-violet-400 shrink-0" />
                {current.location}
              </div>
              <div className="flex items-center gap-2.5 text-sm text-white/40">
                <CameraIcon className="h-4 w-4 text-violet-400 shrink-0" />
                {current.camera}
              </div>
            </div>

            {/* Dot nav */}
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {all.slice(0, 10).map(p => (
                <button key={p.id} onClick={() => setCurrent(p)}
                  className={`rounded-full transition-all duration-300 ${
                    p.id === current.id
                      ? "w-6 h-1.5 bg-violet-400"
                      : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
                  }`} />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main export ───────────────────────────────────────────────────────── */
export const Showcase3D = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [preview, setPreview] = useState<Photo | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<LayoutMode>("carousel");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchPhotos()
      .then(p => { setPhotos(p); setIsLoaded(true); })
      .catch(() => setIsLoaded(true));
  }, []);

  return (
    <section id="showcase" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-20 pointer-events-none" />

      <div className="container-x relative">
        <SectionHeading
          eyebrow="Immersive 3D"
          title="Step inside the gallery."
          description="Drag to orbit · Scroll to zoom · Click to select · Double-click for fullscreen"
        />

        {/* Canvas wrapper */}
        <div className="relative h-[620px] w-full overflow-hidden rounded-3xl border border-white/5"
          style={{ background: "#030108" }}>

          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                <p className="text-xs text-white/30 uppercase tracking-widest">Loading gallery</p>
              </div>
            </div>
          )}

          {isLoaded && photos.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-white/20">Upload photos via the admin panel to see them here.</p>
            </div>
          )}

          {photos.length > 0 && (
            <Canvas
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            >
              <PerspectiveCamera makeDefault position={[0, 1.8, 10]} fov={46} />
              <Scene
                photos={photos}
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                onPreview={setPreview}
                mode={mode}
              />
            </Canvas>
          )}

          {/* ── HUD controls ── */}
          {photos.length > 0 && (
            <>
              {/* Top-left: layout toggle */}
              <div className="absolute top-4 left-4 flex gap-2 z-10">
                {/* <button
                  onClick={() => setMode("carousel")}
                  title="Carousel view"
                  className={`grid h-9 w-9 place-items-center rounded-xl border transition-all backdrop-blur ${
                    mode === "carousel"
                      ? "bg-violet-600/40 border-violet-500/50 text-violet-300"
                      : "bg-black/40 border-white/10 text-white/40 hover:text-white/70"
                  }`}>
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setMode("grid")}
                  title="Grid view"
                  className={`grid h-9 w-9 place-items-center rounded-xl border transition-all backdrop-blur ${
                    mode === "grid"
                      ? "bg-violet-600/40 border-violet-500/50 text-violet-300"
                      : "bg-black/40 border-white/10 text-white/40 hover:text-white/70"
                  }`}>
                  <Grid3x3 className="h-4 w-4" />
                </button> */}
              </div>

              {/* Top-right: photo count */}
              <div className="absolute top-4 right-4 z-10">
                <span className="rounded-xl bg-black/50 backdrop-blur border border-white/8 px-3 py-1.5 text-[10px] uppercase tracking-widest text-white/30">
                  {photos.length} frames
                </span>
              </div>

              {/* Bottom: current photo info strip */}
              <AnimatePresence mode="wait">
                {photos[activeIndex] && (
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-black/60 backdrop-blur border border-white/8 px-5 py-2.5">
                      <span className="text-[9px] uppercase tracking-[0.3em] text-violet-400">
                        {photos[activeIndex].category}
                      </span>
                      <span className="h-3 w-px bg-white/15" />
                      <span className="text-xs font-medium text-white/70">
                        {photos[activeIndex].title}
                      </span>
                      <span className="h-3 w-px bg-white/15" />
                      <button
                        onClick={() => setPreview(photos[activeIndex])}
                        className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-violet-300 transition-colors">
                        <Maximize2 className="h-3 w-3" />
                        <span className="uppercase tracking-wider">Preview</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Double-click hint — fades after 4s */}
              <HintBadge />
            </>
          )}
        </div>
      </div>

      {/* Preview lightbox */}
      <AnimatePresence>
        {preview && (
          <PreviewOverlay
            photo={preview}
            all={photos.slice(0, 10)}
            onClose={() => setPreview(null)} />
        )}
      </AnimatePresence>
    </section>
  );
};

function HintBadge() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 z-10">
          <span className="rounded-full bg-violet-950/70 backdrop-blur border border-violet-500/20 px-4 py-1.5 text-[10px] text-violet-300 uppercase tracking-[0.2em]">
            Double-click any frame to preview
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Showcase3D;