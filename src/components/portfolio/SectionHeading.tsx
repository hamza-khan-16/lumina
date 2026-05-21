import { motion } from "framer-motion";

interface Props {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export const SectionHeading = ({ eyebrow, title, description, align = "left" }: Props) => {
  return (
    <div className={`mb-12 flex flex-col gap-4 ${align === "center" ? "items-center text-center" : ""}`}>
      <motion.span
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="inline-flex w-fit items-center gap-2 rounded-full glass px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground"
      >
        <span className="h-1 w-1 rounded-full bg-gradient-primary" />
        {eyebrow}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="heading text-4xl md:text-5xl font-extrabold leading-tight max-w-3xl"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl text-muted-foreground"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
};

export default SectionHeading;
