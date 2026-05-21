import { motion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import hero from "@/assets/hero.jpg";

export const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen w-full overflow-hidden">
      <img
        src={hero}
        alt="Photographer at twilight on a foggy mountain ridge"
        className="absolute inset-0 h-full w-full object-cover"
        width={1920}
        height={1280}
      />
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-glow opacity-60" />

      <div className="container-x relative z-10 flex min-h-screen flex-col justify-center pt-28">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-primary" />
          Visual Storyteller · Est. 2014
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="heading max-w-4xl text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-extrabold leading-[0.95]"
        >
          Capturing light.<br />
          Crafting <span className="text-gradient">stories</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-7 max-w-xl text-base md:text-lg text-muted-foreground"
        >
          I'm <span className="text-foreground font-medium">Aman Pasi</span> — a fine-art photographer chasing
          fleeting moments across mountains, cities, and the people who inhabit them.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <a
            href="#gallery"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-elegant transition-transform hover:scale-[1.04]"
          >
            View Portfolio
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#about"
            className="inline-flex items-center gap-2 rounded-full glass px-7 py-3.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            About me
          </a>
        </motion.div>
      </div>

      <motion.a
        href="#gallery"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground"
      >
        <span>Scroll</span>
        <ArrowDown className="h-4 w-4 animate-float" />
      </motion.a>
    </section>
  );
};

export default Hero;
