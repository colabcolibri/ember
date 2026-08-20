import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  CommunityBrandingInput,
  CommunityPublicResponse,
  CommunityThemePreset,
} from '@ember/domain/schemas/community-branding';
import {
  AppButton,
  AppCard,
  AppFormField,
  AppInput,
  AppLoading,
  AppPage,
  ThemePresetPicker,
} from '@/components/app/index.js';
import { apiFetch } from '@/lib/api.js';
import { formatApiError } from '@/lib/api-errors.js';
import { showError, showSuccess } from '@/lib/app-toast.js';
import { applyCommunityTheme } from '@/lib/community-theme.js';
import { useInitialLoad } from '@/lib/useInitialLoad.js';

type BrandingResponse = CommunityPublicResponse;

export function AdminCommunityPage() {
  const { t } = useTranslation();
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [introParagraph, setIntroParagraph] = useState('');
  const [blockOneTitle, setBlockOneTitle] = useState('');
  const [blockOneBody, setBlockOneBody] = useState('');
  const [blockTwoTitle, setBlockTwoTitle] = useState('');
  const [blockTwoBody, setBlockTwoBody] = useState('');
  const [blockThreeTitle, setBlockThreeTitle] = useState('');
  const [blockThreeBody, setBlockThreeBody] = useState('');
  const [themePreset, setThemePreset] = useState<CommunityThemePreset>('ember');
  const [saving, setSaving] = useState(false);

  const { initialLoading } = useInitialLoad(async () => {
    const data = await apiFetch<BrandingResponse>('/admin/community/branding');
    setHeroTitle(data.settings.hero?.title ?? '');
    setHeroSubtitle(data.settings.hero?.subtitle ?? '');
    setLogoUrl(data.settings.hero?.logoUrl ?? '');
    setIntroParagraph(data.settings.introParagraph ?? '');
    const blocks = data.settings.blocks ?? [];
    setBlockOneTitle(blocks[0]?.title ?? '');
    setBlockOneBody(blocks[0]?.body ?? '');
    setBlockTwoTitle(blocks[1]?.title ?? '');
    setBlockTwoBody(blocks[1]?.body ?? '');
    setBlockThreeTitle(blocks[2]?.title ?? '');
    setBlockThreeBody(blocks[2]?.body ?? '');
    setThemePreset(data.settings.theme?.preset ?? 'ember');
    applyCommunityTheme(data.settings.theme);
  }, []);

  function onThemePresetChange(preset: CommunityThemePreset) {
    setThemePreset(preset);
    applyCommunityTheme({ preset });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: CommunityBrandingInput = {
        hero: {
          title: heroTitle.trim(),
          subtitle: heroSubtitle.trim(),
          logoUrl: logoUrl.trim() || null,
        },
        introParagraph: introParagraph.trim(),
        blocks: [
          { title: blockOneTitle.trim(), body: blockOneBody.trim() },
          { title: blockTwoTitle.trim(), body: blockTwoBody.trim() },
          { title: blockThreeTitle.trim(), body: blockThreeBody.trim() },
        ].filter((block) => block.title && block.body),
        theme: { preset: themePreset },
      };
      const saved = await apiFetch<BrandingResponse>('/admin/community/branding', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      applyCommunityTheme(saved.settings.theme);
      showSuccess(t('adminCommunity.saved'));
    } catch (err) {
      showError(formatApiError(err, t));
    } finally {
      setSaving(false);
    }
  }

  if (initialLoading) {
    return (
      <AppPage title={t('adminCommunity.title')} lead={t('adminCommunity.lead')}>
        <AppLoading />
      </AppPage>
    );
  }

  return (
    <AppPage title={t('adminCommunity.title')} lead={t('adminCommunity.lead')}>
      <AppCard>
        <form className="space-y-6" onSubmit={onSubmit}>
          <AppFormField label={t('adminCommunity.heroTitle')} htmlFor="heroTitle">
            <AppInput id="heroTitle" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} required />
          </AppFormField>
          <AppFormField label={t('adminCommunity.heroSubtitle')} htmlFor="heroSubtitle">
            <AppInput id="heroSubtitle" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} required />
          </AppFormField>
          <AppFormField label={t('adminCommunity.logoUrl')} htmlFor="logoUrl">
            <AppInput id="logoUrl" type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          </AppFormField>
          <AppFormField label={t('adminCommunity.introParagraph')} htmlFor="introParagraph">
            <AppInput
              id="introParagraph"
              value={introParagraph}
              onChange={(e) => setIntroParagraph(e.target.value)}
              required
            />
          </AppFormField>

          {[1, 2, 3].map((index) => {
            const titleState = [blockOneTitle, blockTwoTitle, blockThreeTitle][index - 1]!;
            const bodyState = [blockOneBody, blockTwoBody, blockThreeBody][index - 1]!;
            const setTitle = [setBlockOneTitle, setBlockTwoTitle, setBlockThreeTitle][index - 1]!;
            const setBody = [setBlockOneBody, setBlockTwoBody, setBlockThreeBody][index - 1]!;
            return (
              <div key={index} className="space-y-3 rounded-xl border border-outline-variant/20 p-4">
                <p className="text-sm font-semibold text-foreground">{t('adminCommunity.block', { index })}</p>
                <AppFormField label={t('adminCommunity.blockTitle')} htmlFor={`block-title-${index}`}>
                  <AppInput id={`block-title-${index}`} value={titleState} onChange={(e) => setTitle(e.target.value)} />
                </AppFormField>
                <AppFormField label={t('adminCommunity.blockBody')} htmlFor={`block-body-${index}`}>
                  <AppInput id={`block-body-${index}`} value={bodyState} onChange={(e) => setBody(e.target.value)} />
                </AppFormField>
              </div>
            );
          })}

          <AppFormField label={t('adminCommunity.themePreset')}>
            <ThemePresetPicker value={themePreset} onChange={onThemePresetChange} />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t('adminCommunity.themeSwatchLegend')}
            </p>
          </AppFormField>

          <AppButton type="submit" disabled={saving}>
            {saving ? t('common.saving') : t('adminCommunity.save')}
          </AppButton>
        </form>
      </AppCard>
    </AppPage>
  );
}
