import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Mail } from 'lucide-react';
import { AppBrand, AppButton } from '../components/app/index.js';
import { GithubIcon, LinkedinIcon } from '../components/icons/brand-icons.js';
import { shellContainerClass } from '@/lib/layout';
import { isMockMode } from '@/lib/mock-mode.js';
import { cn } from '@/lib/utils';

const CONTACT_EMAIL = 'ola@sergioluciano.com';
const CONTACT_LINKEDIN = 'https://linkedin.com/in/sergiolucianojr';
const CONTACT_GITHUB = 'https://github.com/colabcolibri/ember';

const STEP_KEYS = ['create', 'register', 'match', 'meet', 'gather', 'followup'] as const;
const NOT_KEYS = ['networking', 'mentoring', 'meeting'] as const;

const STEP_ICONS: Record<(typeof STEP_KEYS)[number], string> = {
  create: 'event_note',
  register: 'edit_calendar',
  match: 'hub',
  meet: 'mark_email_read',
  gather: 'groups',
  followup: 'check_circle',
};

const HOSTING_KEYS = ['self', 'managed'] as const;

const HOSTING_ICONS: Record<(typeof HOSTING_KEYS)[number], string> = {
  self: 'home_work',
  managed: 'support_agent',
};

function SectionHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {lead ? (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">{lead}</p>
      ) : null}
    </div>
  );
}

function LandingSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('border-t border-outline-variant/20', className)}>
      <div className={cn(shellContainerClass(), 'py-16 sm:py-20 lg:py-24')}>{children}</div>
    </section>
  );
}

function HowItWorksSteps() {
  const { t } = useTranslation();

  return (
    <ol className="relative mx-auto mt-14 max-w-2xl pl-8 sm:pl-10">
      <div
        className="landing-timeline-track absolute top-2 bottom-2 left-0 w-px rounded-full"
        aria-hidden="true"
      />

      {STEP_KEYS.map((key, index) => (
        <li
          key={key}
          className={cn('relative', index < STEP_KEYS.length - 1 ? 'pb-10 sm:pb-12' : 'pb-0')}
        >
          <span
            className="absolute top-0 -left-8 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-primary/25 bg-paper font-serif text-sm font-bold text-primary shadow-[0_0_0_4px_rgba(251,248,243,0.85)] sm:-left-10 sm:size-9 sm:text-base"
            aria-hidden="true"
          >
            {index + 1}
          </span>

          <div className="min-w-0 rounded-2xl border border-outline-variant/20 bg-paper/70 p-5 shadow-sm backdrop-blur-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined mt-0.5 shrink-0 text-2xl text-primary/90"
                aria-hidden="true"
              >
                {STEP_ICONS[key]}
              </span>
              <div className="min-w-0 space-y-2">
                <h3 className="font-serif text-xl font-bold leading-snug text-foreground sm:text-[1.35rem]">
                  {t(`landing.steps.${key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t(`landing.steps.${key}.body`)}
                </p>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function NotSection() {
  const { t } = useTranslation();

  return (
    <LandingSection id="o-que-nao-e" className="landing-not-band border-t-0">
      <SectionHeader title={t('landing.notTitle')} lead={t('landing.notLead')} />

      <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-5">
        {NOT_KEYS.map((key) => (
          <li key={key}>
            <div className="landing-not-reject relative flex min-h-22 items-center justify-center rounded-[1.15rem] border border-outline-variant/45 bg-paper px-5 py-6 sm:min-h-24 sm:px-6">
              <svg
                className="pointer-events-none absolute inset-0 z-1 size-full text-primary/55"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <line x1="10" y1="10" x2="90" y2="90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="90" y1="10" x2="10" y2="90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>

              <span className="relative z-10 text-center font-serif text-lg font-medium text-foreground sm:text-xl">
                {t(`landing.notItems.${key}`)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <blockquote className="mx-auto mt-10 max-w-2xl border-t border-outline-variant/30 pt-10 text-center sm:mt-12 sm:pt-12">
        <p className="font-serif text-xl leading-relaxed text-foreground sm:text-2xl">
          {t('landing.manifesto')}
        </p>
      </blockquote>
    </LandingSection>
  );
}

function HostingSection() {
  const { t } = useTranslation();

  return (
    <LandingSection id="hospedagem" className="landing-section-warm">
      <SectionHeader title={t('landing.hostingTitle')} lead={t('landing.hostingLead')} />

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 sm:gap-5">
        {HOSTING_KEYS.map((key) => (
          <article
            key={key}
            className={cn(
              'relative flex flex-col overflow-hidden rounded-[1.25rem] border border-outline-variant/25 bg-paper p-7 shadow-sm sm:p-9',
              key === 'managed' && 'landing-hosting-card-highlight border-primary/15',
            )}
          >
            {key === 'managed' ? (
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/35 to-transparent"
                aria-hidden="true"
              />
            ) : null}

            <span
              className={cn(
                'material-symbols-outlined text-2xl',
                key === 'managed' ? 'text-primary' : 'text-primary/85',
              )}
              aria-hidden="true"
            >
              {HOSTING_ICONS[key]}
            </span>
            <h3 className="mt-4 font-serif text-xl font-bold text-foreground sm:text-2xl">
              {t(`landing.hostingOptions.${key}.title`)}
            </h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t(`landing.hostingOptions.${key}.body`)}
            </p>
            {key === 'self' ? (
              <a
                href={CONTACT_GITHUB}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                <GithubIcon aria-hidden="true" className="size-4" />
                {t('landing.hostingGithubLink')}
                <ArrowUpRight aria-hidden="true" className="size-3.5 opacity-70" />
              </a>
            ) : null}
          </article>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
        {t('landing.hostingNote')}
      </p>

      <div className="mt-8 flex justify-center">
        <AppButton asChild variant="outline" size="lg" className="w-full sm:w-auto">
          <a href={`mailto:${CONTACT_EMAIL}`}>
            {t('landing.hostingCta')}
            <span className="material-symbols-outlined text-lg">mail</span>
          </a>
        </AppButton>
      </div>
    </LandingSection>
  );
}

type ContactIcon = ComponentType<SVGProps<SVGSVGElement>>;

function ContactLinkCard({
  ariaLabel,
  detail,
  hint,
  href,
  icon: Icon,
  opensInNewTab = false,
  title,
}: {
  ariaLabel: string;
  detail?: string;
  hint: string;
  href: string;
  icon: ContactIcon;
  opensInNewTab?: boolean;
  title: string;
}) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      {...(opensInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group flex gap-4 rounded-[1.15rem] border border-outline-variant/30 bg-paper p-5 transition-[border-color,box-shadow] hover:border-primary/20 hover:shadow-sm sm:p-6"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/30 bg-background/80">
        <Icon aria-hidden="true" className="size-[1.15rem] text-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-serif text-lg font-bold text-foreground">
          {title}
          <ArrowUpRight
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100"
          />
        </span>
        {detail ? (
          <span className="mt-1 block text-sm font-medium text-foreground">{detail}</span>
        ) : null}
        <span className={cn('block text-sm leading-relaxed text-muted-foreground', detail ? 'mt-1' : 'mt-1')}>
          {hint}
        </span>
      </span>
    </a>
  );
}

function ContactSection() {
  const { t } = useTranslation();

  return (
    <LandingSection id="contato">
      <SectionHeader title={t('landing.contactTitle')} lead={t('landing.contactLead')} />

      <div className="mx-auto mt-10 grid max-w-3xl gap-4">
        <ContactLinkCard
          href={`mailto:${CONTACT_EMAIL}`}
          icon={Mail}
          title={t('landing.contactEmailTitle')}
          detail={CONTACT_EMAIL}
          hint={t('landing.contactEmailHint')}
          ariaLabel={t('landing.contactEmailAria')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <ContactLinkCard
            href={CONTACT_GITHUB}
            icon={GithubIcon}
            title={t('landing.contactGithubTitle')}
            hint={t('landing.contactGithubHint')}
            ariaLabel={t('landing.contactGithubAria')}
            opensInNewTab
          />
          <ContactLinkCard
            href={CONTACT_LINKEDIN}
            icon={LinkedinIcon}
            title={t('landing.contactLinkedInTitle')}
            hint={t('landing.contactLinkedInHint')}
            ariaLabel={t('landing.contactLinkedInAria')}
            opensInNewTab
          />
        </div>
      </div>
    </LandingSection>
  );
}

function LandingFooter() {
  const { t } = useTranslation();

  const socialLinks = [
    { href: CONTACT_GITHUB, icon: GithubIcon, label: t('landing.contactGithubAria') },
    { href: CONTACT_LINKEDIN, icon: LinkedinIcon, label: t('landing.contactLinkedInAria') },
    { href: `mailto:${CONTACT_EMAIL}`, icon: Mail, label: t('landing.contactEmailAria') },
  ] as const;

  return (
    <footer className={cn(shellContainerClass(), 'border-t border-outline-variant/20 py-8')}>
      <div className="flex flex-col items-center gap-5">
        <nav aria-label={t('landing.contactNav')} className="flex items-center gap-2">
          {socialLinks.map(({ href, icon: Icon, label }) => (
            <a
              key={href}
              href={href}
              aria-label={label}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              className="inline-flex size-10 items-center justify-center rounded-full border border-outline-variant/30 text-muted-foreground transition-colors hover:border-primary/25 hover:bg-paper hover:text-foreground"
            >
              <Icon aria-hidden="true" className="size-[1.05rem]" />
            </a>
          ))}
        </nav>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">{t('landing.footer')}</p>
      </div>
    </footer>
  );
}

function DemoCta({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <AppButton asChild variant="ink" size="lg" className={className}>
      <Link to="/login">
        {t('landing.demoCta')}
        <span className="material-symbols-outlined text-lg">play_arrow</span>
      </Link>
    </AppButton>
  );
}

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className={cn('relative z-10 w-full', isMockMode && 'pb-20')}>
      <section className="landing-hero-glow relative overflow-hidden border-b border-outline-variant/15">
        <div
          className="pointer-events-none absolute -top-28 right-[8%] size-72 rounded-full border border-primary/10 opacity-60"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-36 -left-20 size-96 rounded-full border border-sage/15 opacity-50"
          aria-hidden="true"
        />

        <div className={cn(shellContainerClass(), 'relative py-16 sm:py-24 lg:py-32')}>
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <AppBrand
              markOnly={false}
              size="lg"
              className="mb-8 h-18 w-auto max-w-52 sm:mb-10 sm:h-25 sm:max-w-68"
            />

            <h1 className="flex max-w-5xl flex-col font-serif text-[clamp(2rem,5.8vw,3.875rem)] leading-[1.08] font-bold tracking-tight text-foreground lowercase">
              <span>{t('landing.headlineLine1')}</span>
              <span className="text-primary">{t('landing.headlineLine2')}</span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t('landing.lead')}
            </p>

            <DemoCta className="mt-10 w-full sm:w-auto sm:min-w-48" />

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t('landing.demoHint')}
            </p>
          </div>
        </div>
      </section>

      <LandingSection id="como-funciona">
        <SectionHeader title={t('landing.howTitle')} lead={t('landing.howLead')} />
        <HowItWorksSteps />
      </LandingSection>

      <NotSection />

      <HostingSection />

      <LandingSection className="border-t-0">
        <div className="landing-cta-panel mx-auto flex max-w-3xl flex-col items-center rounded-4xl border border-primary/15 px-6 py-12 text-center sm:px-10 sm:py-14">
          <h2 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
            {t('landing.finalTitle')}
          </h2>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
            {t('landing.finalLead')}
          </p>
          <DemoCta className="mt-8 w-full sm:w-auto sm:min-w-48" />
        </div>
      </LandingSection>

      <ContactSection />

      <LandingFooter />
    </div>
  );
}
