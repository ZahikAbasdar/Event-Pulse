import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Code2,
  Github,
  Globe2,
  Linkedin,
  Mail,
  PenLine,
  Phone,
  Sparkles,
  Trophy,
} from 'lucide-react';

const profiles = [
  {
    name: 'LinkedIn',
    detail: 'Professional network',
    url: 'https://www.linkedin.com/in/zahik-abas-2646572a4/',
    icon: Linkedin,
    accent: 'from-sky-500/20 to-blue-500/5',
  },
  {
    name: 'GitHub',
    detail: 'Projects & open source',
    url: 'https://github.com/ZahikAbasdar',
    icon: Github,
    accent: 'from-gray-500/20 to-gray-500/5',
  },
  {
    name: 'LeetCode',
    detail: 'Problem solving',
    url: 'https://leetcode.com/u/ZahikAbas',
    icon: Code2,
    accent: 'from-orange-500/20 to-amber-500/5',
  },
  {
    name: 'GeeksforGeeks',
    detail: 'Coding practice',
    url: 'https://www.geeksforgeeks.org/profile/user_f3f23u0irh7',
    icon: Trophy,
    accent: 'from-emerald-500/20 to-green-500/5',
  },
  {
    name: 'Medium',
    detail: 'Articles & ideas',
    url: 'https://medium.com/@zahikabas.btec',
    icon: BookOpen,
    accent: 'from-violet-500/20 to-fuchsia-500/5',
  },
  {
    name: 'HackerRank',
    detail: 'Skills & challenges',
    url: 'https://www.hackerrank.com/profile/zahikabas_btec',
    icon: PenLine,
    accent: 'from-lime-500/20 to-green-500/5',
  },
];

export default function DeveloperProfile() {
  return (
    <div className="page-shell py-12 sm:py-16">
      <section className="developer-hero glass-card mx-auto max-w-6xl p-6 sm:p-10 lg:p-14">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="developer-photo-enter relative mx-auto w-full max-w-sm">
            <div className="developer-orbit" aria-hidden="true" />
            <div className="developer-photo-frame relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-maroon-200 via-white to-gold-200 p-2 shadow-2xl dark:border-white/15 dark:from-maroon-950 dark:via-gray-900 dark:to-gold-950">
              <img
                src="/zahik-abasdar.png"
                alt="Zahik Abas, EventPulse developer"
                className="h-full w-full rounded-[1.55rem] object-cover object-[center_24%]"
              />
              <div className="absolute inset-x-2 bottom-2 rounded-b-[1.45rem] bg-gradient-to-t from-gray-950/80 via-gray-950/25 to-transparent px-5 pb-5 pt-16 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-300">The developer</p>
                <p className="mt-1 font-display text-2xl font-bold">Zahik Abas</p>
              </div>
            </div>
            <div className="developer-status glass-card absolute -bottom-5 -right-3 flex items-center gap-3 px-4 py-3 sm:-right-8">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Building EventPulse</span>
            </div>
          </div>

          <div className="developer-copy-enter">
            <span className="badge gap-2 bg-maroon-50 text-maroon-700 dark:bg-maroon-900/40 dark:text-gold-300">
              <Sparkles size={14} /> Meet the creator
            </span>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-maroon-600 dark:text-gold-400">
              Developer profile
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-5xl">
              Zahik <span className="text-maroon-600 dark:text-gold-400">Abas.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 dark:text-gray-300">
              I built EventPulse to bring PCTE events, participant experiences, and live insights together in one place.
              Explore my work, coding profiles, and professional links below.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="https://zahik-portfolio-rho.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="btn-primary !px-5 !py-3"
              >
                <Globe2 size={17} /> Explore my portfolio <ArrowUpRight size={16} />
              </a>
              <a href="mailto:Zahik@pcte.edu.in" className="btn-secondary !px-5 !py-3">
                <Mail size={17} /> Get in touch
              </a>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <a
                href="tel:+919149793081"
                className="developer-contact glass-card flex items-center gap-3 p-4"
              >
                <span className="rounded-xl bg-maroon-500/10 p-2.5 text-maroon-700 dark:text-gold-300"><Phone size={18} /></span>
                <span className="min-w-0">
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Call or message</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-gray-900 dark:text-white">+91 91497 93081</span>
                </span>
                <ArrowUpRight className="ml-auto shrink-0 text-gray-400" size={16} />
              </a>
              <a
                href="mailto:Zahik@pcte.edu.in"
                className="developer-contact glass-card flex items-center gap-3 p-4"
              >
                <span className="rounded-xl bg-maroon-500/10 p-2.5 text-maroon-700 dark:text-gold-300"><Mail size={18} /></span>
                <span className="min-w-0">
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Email</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-gray-900 dark:text-white">Zahik@pcte.edu.in</span>
                </span>
                <ArrowUpRight className="ml-auto shrink-0 text-gray-400" size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl" aria-labelledby="developer-links-title">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-maroon-600 dark:text-gold-400">Find me online</p>
            <h2 id="developer-links-title" className="mt-2 font-display text-3xl font-bold text-gray-950 dark:text-white">
              Profiles & platforms
            </h2>
          </div>
          <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            Choose a card to open the profile <ArrowDown size={15} />
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map(({ name, detail, url, icon: Icon, accent }, index) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{ animationDelay: `${index * 75}ms` }}
              className={`developer-social glass-card group animate-fadeInUp bg-gradient-to-br ${accent} p-5`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-2xl border border-white/50 bg-white/50 p-3 text-gray-800 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white">
                  <Icon size={22} />
                </span>
                <ArrowUpRight className="text-gray-400 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" size={18} />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-gray-900 dark:text-white">{name}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{detail}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-maroon-700 dark:text-gold-300">
                View profile <ArrowUpRight size={13} />
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
