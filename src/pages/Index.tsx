import { useEffect } from "react";
import Navbar from "@/components/portfolio/Navbar";
import Hero from "@/components/portfolio/Hero";
import Gallery from "@/components/portfolio/Gallery";
import Showcase3D from "@/components/portfolio/Showcase3D";
import About from "@/components/portfolio/About";
import Contact from "@/components/portfolio/Contact";
import Footer from "@/components/portfolio/Footer";

const Index = () => {
  useEffect(() => {
    document.title = "Lumen — Aman Pasi · Fine Art Photography";
    const desc = document.querySelector('meta[name="description"]');
    if (desc)
      desc.setAttribute("content", "Premium fine art photography portfolio by Aman Pasi.");
  }, []);

  return (
    <main className="relative overflow-x-hidden bg-background">
      <Navbar />
      <Hero />
      <Gallery />
      <Showcase3D />
      <About />
      <Contact />
      <Footer />
    </main>
  );
};

export default Index;
