import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Send, Mail, MapPin, Phone } from "lucide-react";
import SectionHeading from "./SectionHeading";

const HIRE_EMAIL = "amanpasi7506003187@gmail.com";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Invalid email").max(160),
  project: z.string().trim().min(5, "Tell me a little more").max(1000),
});

export const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", project: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});

    // Build a pre-filled mailto link — user just clicks Send in their mail app
    const subject = encodeURIComponent(`Hire Inquiry from ${form.name}`);
    const body = encodeURIComponent(
`Hi,

I'd like to get in touch regarding a project.

— Details —
Name: ${form.name}
Email: ${form.email}

Project / Message:
${form.project}

Looking forward to hearing from you!
${form.name}`
    );

    window.location.href = `mailto:${HIRE_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Contact"
              title="Let's create something timeless."
              description="Bookings, collaborations and prints — drop a line and I usually reply within 24 hours."
            />
            <ul className="space-y-4 text-sm">
              {[
                { icon: Mail, text: HIRE_EMAIL },
                { icon: Phone, text: "+91 93218 72782" },
                { icon: MapPin, text: "Mumbai,India" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-muted-foreground">
                  <span className="grid h-10 w-10 place-items-center rounded-full glass">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="glass rounded-3xl p-6 md:p-8 shadow-soft"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Your Name" error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  placeholder="Jane Smith"
                  maxLength={80}
                />
              </Field>
              <Field label="Your Email" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  placeholder="you@studio.com"
                  maxLength={160}
                />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Project Details" error={errors.project}>
                <textarea
                  rows={6}
                  value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  className="w-full rounded-xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground resize-none"
                  placeholder="Tell me about your project — type of shoot, location, timeline, budget…"
                  maxLength={1000}
                />
              </Field>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Clicking "Send via Email" will open your mail app with everything pre-filled — just hit Send.
            </p>

            <button
              type="submit"
              className="mt-4 group inline-flex items-center gap-2 rounded-full bg-gradient-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-elegant transition-transform hover:scale-[1.03]"
            >
              Send via Email
              <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
    {children}
    {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
  </label>
);

export default Contact;
