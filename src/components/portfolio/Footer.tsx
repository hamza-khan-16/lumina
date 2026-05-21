import { Camera, Instagram, Twitter, Youtube, Globe } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="relative border-t border-border py-10">
      <div className="container-x flex flex-col md:flex-row items-center justify-between gap-6">
        <a href="#home" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-elegant">
            <Camera className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="heading text-base font-bold">LUMEN<span className="text-gradient">.</span></span>
        </a>
        <div className="flex items-center gap-2">
          {[Instagram].map((Icon, i) => (
            <a key={i} href="https://www.instagram.com/goflow_aman.7?igsh=MWJvbmxibTdzNzE1bQ==" className="grid h-9 w-9 place-items-center rounded-full glass hover:bg-secondary transition-colors">
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Lumen Studio. All frames reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
