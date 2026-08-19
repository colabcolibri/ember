import { useEffect, useMemo, useState } from 'react';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import type { PlaceRef } from '@/lib/place.js';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiFetch } from '@/lib/api.js';
import { formatApiError } from '@/lib/api-errors.js';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

type PlaceAutocompleteProps = {
  id?: string;
  value: PlaceRef | null;
  onChange: (value: PlaceRef) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
};

export function PlaceAutocomplete({
  id,
  value,
  onChange,
  placeholder = 'Buscar cidade…',
  searchPlaceholder = 'Digite cidade, estado ou país…',
  emptyMessage = 'Nenhum lugar encontrado.',
  className,
}: PlaceAutocompleteProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<PlaceRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useMemo(() => search.trim(), [search]);

  useEffect(() => {
    if (!open || debouncedSearch.length < 2) {
      setOptions([]);
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      apiFetch<{ items: PlaceRef[] }>(
        `/places/autocomplete?text=${encodeURIComponent(debouncedSearch)}`,
      )
        .then((res) => setOptions(res.items))
        .catch((err) => {
          setOptions([]);
          setError(formatApiError(err, t));
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [debouncedSearch, open, t]);

  return (
    <div className="grid gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('h-11 w-full justify-between rounded-xl font-normal', className)}
          >
            <span className="truncate text-left">{value?.label ?? placeholder}</span>
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : null}
              {!loading && debouncedSearch.length < 2 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {t('profile.placeSearchHint')}
                </p>
              ) : null}
              {!loading && debouncedSearch.length >= 2 ? (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              ) : null}
              <CommandGroup>
                {options.map((place) => (
                  <CommandItem
                    key={`${place.placeId}-${place.label}`}
                    value={place.placeId}
                    className="group"
                    onSelect={() => {
                      onChange(place);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        'size-4 shrink-0',
                        value?.placeId === place.placeId ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-medium">{place.label}</span>
                      <span className="truncate text-xs text-muted-foreground group-data-[selected=true]:text-foreground/80">
                        {place.countryCode} · {place.latitude.toFixed(2)}, {place.longitude.toFixed(2)}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
