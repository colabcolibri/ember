import { useMemo, useState } from 'react';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
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
import { filterTimezones, timezoneDisplayLabel } from '@/lib/timezones';
import { cn } from '@/lib/utils';

type TimezoneComboboxProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  browseHint?: string;
  className?: string;
};

export function TimezoneCombobox({
  id,
  value,
  onChange,
  placeholder = 'Selecione o fuso',
  searchPlaceholder = 'Buscar cidade ou região…',
  emptyMessage = 'Nenhum fuso encontrado.',
  browseHint,
  className,
}: TimezoneComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const options = useMemo(() => filterTimezones(search), [search]);
  const selectedLabel = value ? timezoneDisplayLabel(value) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('h-11 w-full min-w-0 max-w-full justify-between rounded-xl font-normal', className)}
        >
          <span className="truncate text-left">{selectedLabel}</span>
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
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((tz) => (
                <CommandItem
                  key={tz.value}
                  value={tz.value}
                  className="group"
                  onSelect={(current) => {
                    onChange(current);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <CheckIcon
                    className={cn('size-4 shrink-0', value === tz.value ? 'opacity-100' : 'opacity-0')}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{tz.label}</span>
                    <span className="truncate text-xs text-muted-foreground group-data-[selected=true]:text-foreground/80">
                      {tz.value} · {tz.utcOffset}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            {!search.trim() && browseHint ? (
              <p className="border-t border-outline-variant/40 px-3 py-2 text-xs text-muted-foreground">
                {browseHint}
              </p>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
