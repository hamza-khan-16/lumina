import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Camera, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#home", label: "Home" },
  { href: "#gallery", label: "Gallery" },
  { href: "#showcase", label: "3D View" },
  // { href: "#upload", label: "Upload" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleHireMe = (e: React.MouseEvent) => {
    e.preventDefault();
    // Scroll to contact section so user can fill the form
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "py-2" : "py-4"
      )}
    >
      <div className="container-x">
        <nav
          className={cn(
            "flex items-center justify-between rounded-2xl px-5 py-3 transition-all duration-500",
            scrolled ? "glass shadow-soft" : "bg-transparent"
          )}
        >
          <a href="#home" className="flex items-center gap-2 group">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-elegant">
              <Camera className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="heading text-lg font-bold tracking-tight">
              LUMEN<span className="text-gradient">.</span>
            </span>
          </a>

          <ul className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="relative px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <a
            href="#contact"
            onClick={handleHireMe}
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-elegant transition-transform hover:scale-[1.03]"
          >
            <Mail className="h-3.5 w-3.5" />
            Hire me
          </a>

          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden grid h-10 w-10 place-items-center rounded-xl glass"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="md:hidden glass mt-2 rounded-2xl p-4"
            >
              <ul className="flex flex-col gap-1">
                {links.map((l) => (
                  <li key={l.href}>
                    <a
                      onClick={() => setOpen(false)}
                      href={l.href}
                      className="block rounded-lg px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#contact"
                    onClick={(e) => { setOpen(false); handleHireMe(e); }}
                    className="mt-1 flex items-center gap-2 rounded-lg bg-gradient-primary px-3 py-3 text-sm font-medium text-primary-foreground"
                  >
                    <Mail className="h-4 w-4" /> Hire me
                  </a>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Navbar;
