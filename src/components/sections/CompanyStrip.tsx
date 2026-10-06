import { findCompanyLogo } from "@/lib/logos";
import { profile } from "@/lib/profile";
import styles from "./CompanyStrip.module.css";

type StripCompany = { name: string; logo: string | null; letterRatio: number };

// Identical copies of the list sit side by side in the track. The track
// slides left by exactly one copy and starts again, which looks like one
// endless line with no jump. Four copies cover screens up to ~3800px wide.
// If you change this number, also change the -25% (= 100% / 4) in the CSS.
const COPIES = 4;

function CompanyList({ companies, hidden }: { companies: StripCompany[]; hidden: boolean }) {
  return (
    <ul className={styles.list} aria-hidden={hidden || undefined}>
      {companies.map((company) => (
        <li key={company.name} className={styles.slot}>
          {company.logo ? (
            // A plain <img>: logos are small local files, and SVGs are not
            // processed by Next's image optimiser. The company name is the
            // accessible label (empty on the decorative repeat copies).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo}
              alt={hidden ? "" : company.name}
              className={styles.logo}
              style={{ "--letter-ratio": company.letterRatio } as React.CSSProperties}
            />
          ) : (
            <span className={styles.wordmark}>{company.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

// The strip rolls at one steady speed and never stops: no hover pause and no
// cursor effect. It only stands still with "prefers-reduced-motion".
// Pure CSS animation, so this is a server component with no JavaScript.
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
      <div className={styles.viewport}>
        <div className={styles.track}>
          {Array.from({ length: COPIES }, (_, i) => (
            // Only the first copy is read by screen readers.
            <CompanyList key={i} companies={companies} hidden={i > 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
