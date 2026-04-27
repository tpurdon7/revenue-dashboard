import Link from 'next/link';

type ProductSection = {
  id: string;
  title: string;
  kicker: string;
  whatItIs: string;
  whatItDoes?: string[];
  includes?: string[];
  whoItsFor?: string;
  formats?: string[];
  inOneLine: string;
};

type ProductGroup = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  sections: ProductSection[];
};

const coreCapabilities = [
  'venture programs',
  'venture building',
  'capital deployment',
  'AI-driven tools',
  'ecosystem development'
];

const productGroups: ProductGroup[] = [
  {
    id: 'b2b-products',
    eyebrow: 'Governments, Corporates, Institutions',
    title: 'B2B Products',
    description: 'Products designed for organisations building pipelines, deploying innovation, and launching new ventures.',
    sections: [
      {
        id: 'venture-building',
        title: 'Venture Building',
        kicker: '2.1',
        whatItIs: 'A full venture creation model that turns corporate assets into new companies.',
        whatItDoes: [
          'Identifies unused or underutilised assets inside corporates',
          'Builds new ventures around them',
          'Pilots with real customers early',
          'Spins them out as independent companies',
          'Supports growth post-launch with capital, talent, and market access'
        ],
        whoItsFor: 'Corporates looking for new revenue streams beyond their core business.',
        inOneLine: 'Turns corporate assets into scalable, standalone companies.'
      },
      {
        id: 'accelerator-incubation',
        title: 'Accelerator & Incubation Programs',
        kicker: '2.2',
        whatItIs: 'Custom-designed startup programs for governments and corporates.',
        whatItDoes: [
          'Sources global startups aligned to a mandate',
          'Runs structured programs including bootcamps, accelerators, and residencies',
          'Supports founders with mentorship, workshops, and GTM',
          'Connects startups to investors, partners, and pilots'
        ],
        formats: ['4 weeks to 6 months', 'Sector-specific or general', 'Local ecosystem or global'],
        inOneLine: 'Builds and runs startup pipelines that deliver real pilots and investments.'
      },
      {
        id: 'startup-scouting',
        title: 'Startup Scouting & Deal Sourcing',
        kicker: '2.3',
        whatItIs: 'Global sourcing of startups and technologies using Brinc’s database and network.',
        whatItDoes: [
          'Identifies startups globally from a 26M+ startup database',
          'Filters based on specific mandates',
          'Supports due diligence and evaluation',
          'Delivers shortlists ready for investment or pilots'
        ],
        inOneLine: 'Finds the right startups globally and filters them down to investable or deployable opportunities.'
      },
      {
        id: 'poc-programs',
        title: 'POC (Pilot) Programs',
        kicker: '2.4',
        whatItIs: 'Structured programs to test startups inside corporates or government environments.',
        whatItDoes: [
          'Identifies use cases',
          'Matches startups to problems',
          'Runs pilots with clear KPIs',
          'Tracks performance and outcomes',
          'Supports scaling post-pilot'
        ],
        inOneLine: 'Takes startups from concept to real deployment inside organisations.'
      },
      {
        id: 'upskilling',
        title: 'Corporate Innovation & Workforce Upskilling',
        kicker: '2.5',
        whatItIs: 'Training and capability-building programs for internal teams.',
        whatItDoes: [
          'Teaches AI, innovation, and entrepreneurship',
          'Builds internal champions',
          'Runs hands-on workshops and real use cases',
          'Supports adoption of new technologies'
        ],
        inOneLine: 'Builds internal capability so organisations can actually implement innovation.'
      },
      {
        id: 'soft-landing',
        title: 'Soft Landing / Market Entry Programs',
        kicker: '2.6',
        whatItIs: 'Programs that help companies expand into new regions.',
        whatItDoes: ['Regulatory navigation', 'Entity setup', 'GTM strategy', 'Local partnerships', 'Investor introductions'],
        inOneLine: 'Helps startups and scaleups enter new markets and actually succeed there.'
      },
      {
        id: 'ai-implementation',
        title: 'AI Implementation (Brinc Lab)',
        kicker: '2.7',
        whatItIs: 'A fast AI deployment service for businesses.',
        whatItDoes: [
          'Identifies a high-impact workflow',
          'Builds a custom AI system inside existing tools',
          'Deploys in around 3 weeks',
          'Tracks measurable ROI'
        ],
        inOneLine: 'Turns one business workflow into a working AI system in weeks.'
      }
    ]
  },
  {
    id: 'capital-products',
    eyebrow: 'Funds, Syndicates, SPVs',
    title: 'Capital Products',
    description: 'Investment vehicles that translate Brinc’s venture pipeline into deployable capital opportunities.',
    sections: [
      {
        id: 'rasmal-fund',
        title: 'Brinc × Rasmal Fund',
        kicker: '3.1',
        whatItIs: 'A venture fund combining Brinc deal flow with institutional fund management.',
        whatItDoes: [
          'Sources startups through the accelerator pipeline',
          'De-risks them through programs',
          'Invests in top performers from Pre-Seed to Series A',
          'Supports scaling post-investment'
        ],
        inOneLine: 'A fund built on pre-filtered, accelerator-driven deal flow.'
      },
      {
        id: 'syndicates-spvs',
        title: 'Syndicates & SPVs',
        kicker: '3.2',
        whatItIs: 'Deal-by-deal investment opportunities.',
        whatItDoes: [
          'Allows investors to co-invest in selected startups',
          'Focuses on top performers from the Brinc ecosystem',
          'Enables flexible participation'
        ],
        inOneLine: 'Direct access to curated startup deals.'
      }
    ]
  },
  {
    id: 'platform-ecosystem',
    eyebrow: 'Infrastructure, OS, Network Effects',
    title: 'Platform & Ecosystem Products',
    description: 'The software, data, and global network layers that power everything else Brinc delivers.',
    sections: [
      {
        id: 'ventureverse',
        title: 'VentureVerse',
        kicker: '4.1',
        whatItIs: 'An AI-powered operating system for founders.',
        whatItDoes: [
          'Combines legal, finance, fundraising, and strategy tools',
          'Uses AI to generate outputs including decks, memos, and research',
          'Shares context across tools',
          'Includes investor matching and analytics'
        ],
        inOneLine: 'An all-in-one AI platform to build, fund, and scale startups.'
      },
      {
        id: 'platform-infrastructure',
        title: 'Global Venture Platform Infrastructure',
        kicker: '4.2',
        whatItIs: 'The operating infrastructure behind Brinc’s venture programs, capital, and ecosystem work.',
        includes: [
          '26M+ startup database',
          'AI-driven scouting tools',
          'Global mentor network',
          'Investor network',
          'Government and corporate partnerships'
        ],
        inOneLine: 'The infrastructure that powers everything else Brinc does.'
      }
    ]
  },
  {
    id: 'founder-products',
    eyebrow: 'Founder-Facing',
    title: 'Founder Products',
    description: 'Programs and environments designed directly for founders navigating growth, fundraising, and market expansion.',
    sections: [
      {
        id: 'moniify',
        title: 'Virtual Accelerator (Moniify)',
        kicker: '5.1',
        whatItIs: 'A 4-week online accelerator.',
        whatItDoes: [
          'Weekly 1:1 strategy sessions',
          'GTM and fundraising planning',
          'Investor introductions',
          'Demo day exposure'
        ],
        inOneLine: 'A fast-track program to sharpen strategy and raise capital.'
      },
      {
        id: 'apex',
        title: 'Founder Retreat (Apex)',
        kicker: '5.2',
        whatItIs: 'A high-end, invite-only retreat for $1M+ founders.',
        whatItDoes: [
          'Curated peer group',
          'Access to top operators',
          'Deep strategy work',
          'Concrete outputs including GTM, roadmap, and systems'
        ],
        inOneLine: 'A high-leverage environment for founders scaling to 8–9 figures.'
      },
      {
        id: 'china-outbound',
        title: 'China Outbound Accelerator',
        kicker: '5.3',
        whatItIs: 'A market entry platform for Chinese and Hong Kong companies.',
        whatItDoes: [
          '12-week expansion program',
          'Government and investor access',
          'Talent deployment',
          'AI localisation',
          'PR and positioning'
        ],
        inOneLine: 'Helps Chinese companies expand into MENA and Southeast Asia.'
      }
    ]
  }
];

function ProductCard({ section }: { section: ProductSection }) {
  return (
    <article className="rounded-3xl border border-[var(--brand-line)] bg-white p-6 shadow-[0_16px_40px_rgba(15,17,21,0.06)] sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-orange)]">{section.kicker}</p>
        <div className="h-px flex-1 bg-[var(--brand-line)]" />
      </div>

      <h3 className="mt-4 text-2xl font-bold tracking-tight text-[var(--brand-ink)]">{section.title}</h3>
      <p className="mt-4 text-sm font-bold uppercase tracking-[0.12em] text-[var(--brand-muted)]">What It Is</p>
      <p className="mt-2 text-base leading-7 text-[var(--brand-ink)]">{section.whatItIs}</p>

      {section.whatItDoes ? (
        <>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-[var(--brand-muted)]">What It Does</p>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--brand-ink)]">
            {section.whatItDoes.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-[var(--brand-orange)]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {section.includes ? (
        <>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-[var(--brand-muted)]">What It Includes</p>
          <ul className="mt-3 flex flex-wrap gap-3">
            {section.includes.map((item) => (
              <li
                key={item}
                className="rounded-full border border-[var(--brand-line)] bg-[#faf7f4] px-3 py-1.5 text-sm font-medium text-[var(--brand-ink)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {section.whoItsFor ? (
        <div className="mt-6 rounded-2xl border border-[var(--brand-line)] bg-[#faf7f4] p-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--brand-muted)]">Who It’s For</p>
          <p className="mt-2 text-sm leading-7 text-[var(--brand-ink)]">{section.whoItsFor}</p>
        </div>
      ) : null}

      {section.formats ? (
        <div className="mt-6 rounded-2xl border border-[var(--brand-line)] bg-[#faf7f4] p-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--brand-muted)]">Formats</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {section.formats.map((format) => (
              <span
                key={format}
                className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[var(--brand-ink)] ring-1 ring-[var(--brand-line)]"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-[var(--brand-orange)] bg-gradient-to-r from-[#fff7f2] to-[#fff1ea] p-4">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--brand-orange)]">In One Line</p>
        <p className="mt-2 text-base font-medium leading-7 text-[var(--brand-ink)]">{section.inOneLine}</p>
      </div>
    </article>
  );
}

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-[#faf7f4] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-[var(--brand-line)] bg-white p-6 shadow-[0_24px_60px_rgba(15,17,21,0.06)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--brand-orange)]">Brinc Report</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-[var(--brand-ink)] sm:text-6xl">
                Brinc Product Suite
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-8 text-[var(--brand-muted)] sm:text-xl">
                A single view of everything Brinc offers across venture, programs, capital, and platforms.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full border border-[var(--brand-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--brand-ink)] transition hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)]"
              >
                Dashboard
              </Link>
              <Link
                href="/deals"
                className="rounded-full border border-[var(--brand-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--brand-ink)] transition hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)]"
              >
                Deal tables
              </Link>
            </div>
          </div>

          <section className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <article className="rounded-3xl border-2 border-[var(--brand-orange)] bg-gradient-to-br from-white via-[#fff7f2] to-[#ffe8df] p-6 shadow-[0_24px_60px_rgba(228,88,58,0.16)] sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-muted)]">1. Core Platform</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
                What Brinc Actually Is
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--brand-ink)] sm:text-lg">
                Brinc is a global venture platform that helps governments, corporates, investors, and founders go from
                idea to pilot to scaled company.
              </p>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-[var(--brand-muted)]">How It Does This</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {coreCapabilities.map((capability) => (
                  <span
                    key={capability}
                    className="rounded-full border border-[var(--brand-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-ink)]"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </article>

            <aside className="rounded-3xl border border-[var(--brand-line)] bg-[var(--brand-ink)] p-6 text-white shadow-[0_16px_40px_rgba(15,17,21,0.2)] sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Core Idea</p>
              <p className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
                Create and scale real companies, not just run programs.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/60">Coverage</p>
                  <p className="mt-2 text-lg font-bold">Venture to platform</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/60">Audience</p>
                  <p className="mt-2 text-lg font-bold">B2B + founders</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/60">Outcome</p>
                  <p className="mt-2 text-lg font-bold">Pilots to scale</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/60">Engine</p>
                  <p className="mt-2 text-lg font-bold">Programs + capital + AI</p>
                </div>
              </div>
            </aside>
          </section>
        </header>

        <section className="mt-8 rounded-[2rem] border border-[var(--brand-line)] bg-white p-6 shadow-[0_16px_40px_rgba(15,17,21,0.06)] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--brand-orange)]">Product Map</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
                One Platform, Four Product Layers
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--brand-muted)] sm:text-base">
              Brinc spans enterprise services, capital products, founder software, and founder-facing programs, all
              anchored to venture creation and venture scaling.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {productGroups.map((group) => (
              <article
                key={group.id}
                className="rounded-3xl border border-[var(--brand-line)] bg-[#faf7f4] p-5 transition hover:border-[var(--brand-orange)]"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-orange)]">{group.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-[var(--brand-ink)]">{group.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--brand-muted)]">{group.description}</p>
                <p className="mt-5 text-sm font-semibold text-[var(--brand-ink)]">{group.sections.length} offers in this layer</p>
              </article>
            ))}
          </div>
        </section>

        {productGroups.map((group) => (
          <section key={group.id} className="mt-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--brand-orange)]">{group.eyebrow}</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--brand-ink)] sm:text-4xl">{group.title}</h2>
              </div>
              <p className="max-w-3xl text-sm leading-7 text-[var(--brand-muted)] sm:text-base">{group.description}</p>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {group.sections.map((section) => (
                <ProductCard key={section.id} section={section} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
