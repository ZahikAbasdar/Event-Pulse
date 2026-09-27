import { useState } from 'react';
import { ArrowUpRight, ExternalLink, Trophy } from 'lucide-react';

function ShowcaseCard({ item }) {
  return (
    <article className="glass-card group overflow-hidden p-0">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={item.image} alt={`${item.title} original illustration`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
          Original illustration
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-maroon-600 dark:text-gold-400">{item.category}</p>
        <h3 className="mt-2 font-display text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{item.description}</p>
      </div>
    </article>
  );
}

export default function SocietyShowcase({ content }) {
  const [selectedDepartment, setSelectedDepartment] = useState(
    content.standings?.find((item) => item.department === 'Business Management (BBA/MBA)')?.department ||
      content.standings?.[0]?.department
  );
  const selectedStanding = content.standings?.find((item) => item.department === selectedDepartment);

  return (
    <div className="space-y-12">
      <section>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-maroon-600 dark:text-gold-400">{content.eyebrow}</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-gray-900 dark:text-white">{content.galleryTitle}</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.gallery.map((item) => <ShowcaseCard key={item.title} item={item} />)}
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-maroon-600 dark:text-gold-400">Events spectrum</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-gray-900 dark:text-white">{content.spectrumTitle}</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {content.spectrum.map((item) => <ShowcaseCard key={item.title} item={item} />)}
        </div>
      </section>

      {content.stats && (
        <section className="grid gap-4 sm:grid-cols-3">
          {content.stats.map((stat) => (
            <div key={stat.label} className="glass-card p-6 text-center">
              <p className="font-display text-3xl font-bold text-maroon-700 dark:text-gold-400">{stat.value}</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{stat.label}</p>
            </div>
          ))}
        </section>
      )}

      {content.performers && (
        <section>
          <h2 className="mb-5 font-display text-2xl font-bold text-gray-900 dark:text-white">Marquee Performers</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {content.performers.map((performer) => (
              <div key={performer.name} className="glass-card p-5">
                <p className="font-display text-lg font-bold text-gray-900 dark:text-white">{performer.name}</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{performer.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.standings && (
        <section className="glass-card p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <Trophy className="mt-1 shrink-0 text-gold-500" />
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{content.standingsTitle}</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{content.standingsNote}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {content.standings.map((standing) => (
                <button
                  key={standing.department}
                  type="button"
                  onClick={() => setSelectedDepartment(standing.department)}
                  aria-pressed={selectedDepartment === standing.department}
                  className={`glass-card p-4 text-left transition hover:-translate-y-0.5 ${selectedDepartment === standing.department ? 'ring-2 ring-maroon-500 dark:ring-gold-400' : ''}`}
                >
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">{standing.department}</span>
                  <span className="mt-2 block font-display text-2xl font-bold text-maroon-700 dark:text-gold-400">{standing.points} pts</span>
                </button>
              ))}
            </div>
            {selectedStanding && (
              <div className="rounded-2xl bg-white/45 p-5 dark:bg-black/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Scoreboard profile</p>
                <h3 className="mt-2 font-display text-xl font-bold text-gray-900 dark:text-white">{selectedStanding.department}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{selectedStanding.points} total trophy points</p>
                <h4 className="mt-5 text-sm font-semibold text-gray-900 dark:text-white">Winning events</h4>
                <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {selectedStanding.wins.map((win) => <li key={win}>• {win}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="glass-card flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">{content.ctaTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{content.ctaText}</p>
          {content.officialGalleryUrl && (
            <a href={content.officialGalleryUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-maroon-700 hover:underline dark:text-gold-400">
              View PCTE’s official photo tour <ExternalLink size={14} />
            </a>
          )}
          {content.officialFestivalUrl && (
            <a href={content.officialFestivalUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 text-sm font-semibold text-maroon-700 hover:underline dark:text-gold-400 sm:mt-2">
              Read PCTE’s official festival page <ExternalLink size={14} />
            </a>
          )}
        </div>
        <a href={content.ctaUrl} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0">
          Connect with PCTE <ArrowUpRight size={16} />
        </a>
      </section>
    </div>
  );
}
