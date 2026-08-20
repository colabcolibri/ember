import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppAlertDialog } from './AppAlertDialog.js';
import { AppButton } from './AppButton.js';
import { mockStore } from '@/mock/store.js';

export function DemoResetButton() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function resetDemo() {
    setLoading(true);
    mockStore.reset();
    window.location.reload();
  }

  return (
    <>
      <AppButton
        type="button"
        variant="outline"
        size="sm"
        className="fixed bottom-20 left-4 z-50 max-w-[min(calc(100vw-2rem),14rem)] shadow-md sm:right-6 sm:bottom-6 sm:left-auto"
        onClick={() => setDialogOpen(true)}
        aria-label={t('app.demoReset')}
      >
        <span className="material-symbols-outlined text-base" aria-hidden>
          restart_alt
        </span>
        {t('app.demoReset')}
      </AppButton>

      <AppAlertDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!loading) setDialogOpen(open);
        }}
        title={t('app.demoResetConfirmTitle')}
        description={t('app.demoResetConfirmDescription')}
        cancelLabel={t('nav.cancel')}
        confirmLabel={t('app.demoReset')}
        variant="destructive"
        onConfirm={resetDemo}
        loading={loading}
      />
    </>
  );
}
