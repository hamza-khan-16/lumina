import { motion } from "framer-motion";
import { Award, Camera, Globe, Instagram, Twitter, Youtube } from "lucide-react";
import about from "@/assets/about.png";
import SectionHeading from "./SectionHeading";

const stats = [
  { value: "10+", label: "Years shooting" },
  { value: "240k", label: "Frames captured" },
  { value: "38", label: "Countries" },
  { value: "12", label: "Awards" },
];

const skills = ["Portrait", "Landscape", "Street", "Architecture", "Editorial", "Color Grading", "Long Exposure", "Aerial"];

export const About = () => {
  return (
    <section id="about" className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
            <div className="relative overflow-hidden rounded-3xl shadow-elegant">
              <img src={about} alt="Portrait of Aiden Vance" loading="lazy" className="w-full h-auto object-cover" />
            </div>
          </motion.div>

          <div>
            <SectionHeading
              eyebrow="About"
              title="A decade behind the lens — and counting."
              description="From the snowy peaks of Kashmir to the Blue Indian ocean of Kanyakumari, my craft lives in the moments most people walk past. I shoot to make you look twice."
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="rounded-2xl glass p-4"
                >
                  <div className="heading text-2xl font-bold text-gradient">{s.value}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="mb-8">
              <h3 className="text-sm uppercase tracking-[0.25em] text-muted-foreground mb-3">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="rounded-full glass px-3 py-1 text-xs">{s}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {[
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Youtube, href: "#", label: "YouTube" },
                { icon: Globe, href: "#", label: "Website" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full glass hover:bg-secondary hover:scale-110 transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
              <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <Award className="h-4 w-4 text-primary-glow" /> Sony Alpha Ambassador
                <Camera className="h-4 w-4 text-primary-glow ml-2" /> Available worldwide
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
