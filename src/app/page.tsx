import { About } from "@/components/sections/About";
import { CompanyStrip } from "@/components/sections/CompanyStrip";
import { ContactCall } from "@/components/sections/ContactCall";
import { Education } from "@/components/sections/Education";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";

// The home page, sections in order. The header and footer come from layout.tsx.
export default function HomePage() {
  return (
    <>
      <Hero />
      <CompanyStrip />
      <About />
      <Experience />
      <Projects />
      <Skills />
      <Education />
      <ContactCall />
    </>
  );
}
