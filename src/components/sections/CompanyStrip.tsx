import { findCompanyLogo } from "@/lib/logos";
import { profile } from "@/lib/profile";
import { CompanyTrack, type StripCompany } from "./CompanyTrack";
import styles from "./CompanyStrip.module.css";

export function CompanyStrip() {
  const companies: StripCompany[] = profile.companies.map((company) => ({
    name: company.name,
    logo: findCompanyLogo(company.logo),
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
