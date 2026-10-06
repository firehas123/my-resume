import { findCompanyLogo } from "@/lib/logos";
import { profile } from "@/lib/profile";
import { CompanyTrack, type StripCompany } from "./CompanyTrack";
import styles from "./CompanyStrip.module.css";

// Server part: finds the logo files at build time and hands plain data to the
// rolling, cursor-reactive track (CompanyTrack.tsx).
export function CompanyStrip() {
  const companies: StripCompany[] = profile.companies.map((company) => ({
    name: company.name,
    logo: findCompanyLogo(company.logo),
    letterRatio: company.letterRatio,
  }));

  return (
    <section className={styles.strip} aria-labelledby="companies-title">
      <div className="container">
        <h2 id="companies-title" className={styles.label}>
          Companies I’ve worked with
        </h2>
      </div>
      <CompanyTrack companies={companies} />
    </section>
  );
}
