import React from 'react';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { Check, X, ChevronDown, ArrowRight, Zap, Monitor, Server, BadgeCheck } from 'lucide-react';

/* ---------------------------------------------------------------- helpers */

const EASE = [0.22, 1, 0.36, 1];

/** Scroll-reveal wrapper. data-reveal lets a <noscript> rule force visibility. */
function Reveal({ children, delay = 0, y = 24, className = '' }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ kicker, title, sub }) {
  return (
    <Reveal className="mx-auto mb-10 max-w-2xl text-center">
      {kicker && (
        <div className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-sticker">
          {kicker}
        </div>
      )}
      <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-ink-soft">{sub}</p>}
    </Reveal>
  );
}

const yesish = v => /^(yes|unlimited|included|free)/i.test(String(v).trim());
const noish = v => /^(no|none|closed|not )/i.test(String(v).trim());

function CellValue({ value, us }) {
  if (yesish(value))
    return (
      <span className={`inline-flex items-center gap-1.5 ${us ? 'font-semibold text-mint' : ''}`}>
        <Check className="h-4 w-4 shrink-0 text-mint" aria-hidden="true" /> {value}
      </span>
    );
  if (noish(value))
    return (
      <span className="inline-flex items-center gap-1.5 text-ink-soft">
        <X className="h-4 w-4 shrink-0 text-ink-soft/60" aria-hidden="true" /> {value}
      </span>
    );
  return <span className={us ? 'font-semibold' : ''}>{value}</span>;
}

/* ---------------------------------------------------------------- sections */

function Header({ p }) {
  return (
    <header className="relative z-10 border-b border-line bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <a href="/" className="font-display text-lg font-extrabold tracking-tight">
          OneTime<span className="text-sticker">Suite</span>
        </a>
        <nav className="hidden items-center gap-6 font-mono text-xs font-semibold uppercase tracking-wider text-ink-soft sm:flex">
          <a className="hover:text-ink" href="#features">Features</a>
          <a className="hover:text-ink" href={`#vs-${p.competitorSlug}`}>vs {p.competitor}</a>
          <a className="hover:text-ink" href="#pricing">Pricing</a>
          <a className="hover:text-ink" href="#faq">FAQ</a>
        </nav>
        <a
          href={p.buyUrl}
          className="rounded-full bg-ink px-4 py-1.5 font-mono text-xs font-bold text-paper transition-colors hover:bg-sticker"
        >
          Get {p.brand}
        </a>
      </div>
    </header>
  );
}

function Hero({ p }) {
  const reduce = useReducedMotion();
  const item = i => ({
    initial: { opacity: 0, y: reduce ? 0 : 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: 0.08 * i, ease: EASE },
  });
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div data-reveal="" {...item(0)} className="mb-5 flex items-center justify-center gap-3">
          <motion.span
            className="text-5xl"
            aria-hidden="true"
            animate={reduce ? {} : { rotate: [0, -6, 6, 0] }}
            transition={{ duration: 5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          >
            {p.icon}
          </motion.span>
          <span className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{p.brand}</span>
        </motion.div>

        <motion.div data-reveal="" {...item(1)} className="mb-6 flex justify-center">
          <span className="sticker px-4 py-1.5 text-sm">
            {p.pricing.kind === 'desktop'
              ? `$${p.pricing.once} once — yours forever`
              : `from $${p.pricing.monthly}/mo · or $${p.pricing.lifetime} forever`}
          </span>
        </motion.div>

        <motion.h1 data-reveal="" {...item(2)} className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {p.tagline}
        </motion.h1>

        <motion.p data-reveal="" {...item(3)} className="mx-auto mt-5 max-w-2xl text-ink-soft sm:text-lg">
          {p.heroLead}
        </motion.p>

        <motion.div data-reveal="" {...item(4)} className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={p.buyUrl}
            className="group inline-flex items-center gap-2 rounded-full bg-sticker px-7 py-3 font-mono text-sm font-bold text-white shadow-lg shadow-sticker/25 transition-colors hover:bg-sticker-dark"
          >
            Get {p.brand} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </a>
          <a href="#pricing" className="font-mono text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-sticker">
            See pricing
          </a>
        </motion.div>

        <motion.div data-reveal="" {...item(5)} className="mt-6 inline-flex items-center gap-2 font-mono text-xs text-ink-soft">
          {p.isDesktop ? <Monitor className="h-4 w-4" aria-hidden="true" /> : <Server className="h-4 w-4" aria-hidden="true" />}
          {p.stampText}
        </motion.div>
      </div>
    </section>
  );
}

function Features({ p }) {
  return (
    <section id="features" className="relative px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading kicker="What you get" title="Everything in the box" sub={p.oneliner} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {p.features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08} className="h-full">
              <div className="h-full rounded-2xl border border-line bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-3 text-3xl" aria-hidden="true">{f.icon}</div>
                <h3 className="font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Comparison({ p }) {
  const reduce = useReducedMotion();
  return (
    <section id={`vs-${p.competitorSlug}`} className="relative px-5 py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          kicker="Side by side"
          title={`${p.brand} vs ${p.competitor}`}
          sub={`${p.competitor} charges ${p.compPrice}. Here's what actually differs.`}
        />
        <Reveal>
          <div className="overflow-x-auto rounded-2xl border border-line bg-card shadow-sm">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-xs uppercase tracking-wider text-ink-soft">
                  <th className="px-5 py-4 font-semibold" scope="col">&nbsp;</th>
                  <th className="relative px-5 py-4 font-bold text-sticker" scope="col">
                    <motion.span
                      data-reveal=""
                      className="absolute inset-x-2 inset-y-1 -z-10 rounded-lg bg-sticker/10"
                      initial={{ opacity: 0, scaleX: reduce ? 1 : 0.4 }}
                      whileInView={{ opacity: 1, scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
                      aria-hidden="true"
                    />
                    {p.brand}
                  </th>
                  <th className="px-5 py-4 font-semibold" scope="col">{p.competitor}</th>
                </tr>
              </thead>
              <tbody>
                {p.compRows.map((r, i) => (
                  <motion.tr
                    key={r.label}
                    data-reveal=""
                    className="border-b border-line/70 last:border-0"
                    initial={{ opacity: 0, x: reduce ? 0 : -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
                  >
                    <th scope="row" className="px-5 py-3.5 font-medium text-ink-soft">{r.label}</th>
                    <td className="bg-sticker/[0.04] px-5 py-3.5"><CellValue value={r.us} us /></td>
                    <td className="px-5 py-3.5"><CellValue value={r.them} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
        {p.payback && (
          <Reveal delay={0.15} className="mt-6 text-center">
            <p className="mx-auto max-w-2xl font-mono text-sm text-ink-soft">
              <Zap className="mr-1 inline h-4 w-4 text-sticker" aria-hidden="true" />
              {p.payback}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function TierCard({ name, price, listPrice, period, note, hero, cta, ctaLabel, delay }) {
  return (
    <Reveal delay={delay} className="h-full">
      <div
        className={
          'relative flex h-full flex-col rounded-2xl border p-7 shadow-sm ' +
          (hero
            ? 'border-sticker bg-card shadow-lg shadow-sticker/10 lg:scale-[1.04]'
            : 'border-line bg-card')
        }
      >
        {hero && (
          <span className="sticker absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 text-[11px]">
            Pay once, own it forever
          </span>
        )}
        <div className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">{name}</div>
        <div className="mt-3 flex items-baseline gap-2">
          {listPrice && (
            <span className="font-display text-xl font-bold text-ink-soft line-through decoration-sticker decoration-2" aria-label={`Launch price $${listPrice}`}>
              ${listPrice}
            </span>
          )}
          <span className="font-display text-4xl font-extrabold tracking-tight">${price}</span>
          {period && <span className="font-mono text-sm text-ink-soft">{period}</span>}
        </div>
        {listPrice && (
          <div className="mt-1 font-mono text-[11px] font-semibold text-sticker">
            50% off launch price — intro pricing, first 1,000 licenses
          </div>
        )}
        {note && (
          <div className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-mint">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> {note}
          </div>
        )}
        <div className="grow" />
        <a
          href={cta}
          className={
            'mt-6 block rounded-full px-5 py-2.5 text-center font-mono text-sm font-bold transition-colors ' +
            (hero
              ? 'bg-sticker text-white hover:bg-sticker-dark'
              : 'border border-ink/20 text-ink hover:border-sticker hover:text-sticker')
          }
        >
          {ctaLabel}
        </a>
      </div>
    </Reveal>
  );
}

function Pricing({ p }) {
  const pr = p.pricing;
  return (
    <section id="pricing" className="relative px-5 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          kicker="Pricing"
          title={pr.kind === 'desktop' ? 'One price. No asterisks.' : 'Pick how you pay'}
          sub={
            pr.kind === 'desktop'
              ? `Desktop app — pay once, it's yours on your machine forever.`
              : `Subscriptions if you want them — but the whole point is the lifetime tier.`
          }
        />
        {pr.kind === 'desktop' ? (
          <div className="mx-auto max-w-sm">
            <TierCard
              name="Lifetime license"
              price={pr.once}
              period="once"
              note="Free updates · MIT source on GitHub"
              hero
              cta={p.buyUrl}
              ctaLabel={`Get ${p.brand} — $${pr.once}`}
              delay={0}
            />
          </div>
        ) : (
          <div className="grid items-stretch gap-5 pt-4 sm:grid-cols-3">
            <TierCard name="Monthly" price={pr.monthly} period="/mo" cta={p.buyUrl} ctaLabel="Start monthly" delay={0} />
            <TierCard
              name="Lifetime"
              price={pr.lifetime}
              listPrice={pr.lifetimeList}
              period="once"
              hero
              note="Never pay again"
              cta={p.buyUrl}
              ctaLabel={`Own it — $${pr.lifetime}`}
              delay={0.1}
            />
            <TierCard name="Yearly" price={pr.yearly} period="/yr" note="2 months free" cta={p.buyUrl} ctaLabel="Start yearly" delay={0.2} />
          </div>
        )}
        <Reveal delay={0.2} className="mt-8 text-center font-mono text-xs text-ink-soft">
          Checkout by Whop · instant delivery · {p.competitor} costs {p.compPrice}
        </Reveal>
      </div>
    </section>
  );
}

function Video({ p }) {
  if (!p.videoId) return null;
  return (
    <section className="relative px-5 py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHeading kicker="See it run" title={`${p.brand} in 60 seconds`} />
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-line bg-ink shadow-lg">
            <div className="relative aspect-video">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${p.videoId}`}
                title={`${p.brand} demo video`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Steps({ p }) {
  if (!p.steps.length) return null;
  return (
    <section className="relative px-5 py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading kicker="How it works" title="Up and running in three steps" />
        <ol className="grid gap-4 sm:grid-cols-3">
          {p.steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1} className="h-full">
              <li className="h-full list-none rounded-2xl border border-line bg-card p-6 shadow-sm">
                <span className="sticker mb-4 inline-flex h-8 w-8 items-center justify-center text-sm" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="font-display text-base font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Faq({ p }) {
  if (!p.faq.length) return null;
  return (
    <section id="faq" className="relative px-5 py-20">
      <div className="mx-auto max-w-2xl">
        <SectionHeading kicker="FAQ" title="Fair questions" />
        <div className="space-y-3">
          {p.faq.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <details className="faq group rounded-2xl border border-line bg-card px-5 shadow-sm">
                <summary className="flex items-center justify-between gap-4 py-4 font-display text-sm font-bold sm:text-base">
                  {f.q}
                  <ChevronDown className="chev h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ p }) {
  return (
    <section className="relative px-5 pb-24 pt-8">
      <Reveal className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-line bg-ink px-8 py-12 text-center text-paper shadow-xl">
          <div className="mb-3 text-4xl" aria-hidden="true">{p.icon}</div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Stop renting. Own {p.brand}.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-paper/70">{p.oneliner}</p>
          <a
            href={p.buyUrl}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-sticker px-8 py-3 font-mono text-sm font-bold text-white transition-colors hover:bg-sticker-dark"
          >
            Get {p.brand}
            {p.pricing.kind === 'desktop' ? ` — $${p.pricing.once} once` : ` — $${p.pricing.lifetime} forever`}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </Reveal>
      <footer className="mx-auto mt-10 max-w-3xl text-center font-mono text-xs text-ink-soft">
        <a href="/" className="hover:text-sticker">OneTimeSuite</a> · pay once, own it forever ·{' '}
        {p.repo && (
          <a href={`https://github.com/bensblueprints/${p.repo}`} className="underline underline-offset-2 hover:text-sticker">
            source on GitHub
          </a>
        )}
      </footer>
    </section>
  );
}

/* ---------------------------------------------------------------- page */

export default function ProductPage({ product }) {
  return (
    <MotionConfig reducedMotion="user">
      <Header p={product} />
      <main className="relative z-[1]">
        <Hero p={product} />
        <Features p={product} />
        <Comparison p={product} />
        <Pricing p={product} />
        <Video p={product} />
        <Steps p={product} />
        <Faq p={product} />
        <FinalCta p={product} />
      </main>
    </MotionConfig>
  );
}
