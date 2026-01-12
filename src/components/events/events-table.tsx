'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { StressBadge } from './stress-badge';
import { CategoryBadge } from './category-badge';
import { WindowStatus } from './window-status';
import { Sparkline } from '@/components/charts/sparkline';
import type { EventDefinition, SignalPoint, StressResult, StressLevel } from '@/lib/types';

export interface EventWithSignal {
  event: EventDefinition;
  signal: SignalPoint[];
  stress: StressResult;
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });

  return `${startStr} - ${endStr}`;
}

const stressOrder: Record<string, number> = { high: 0, med: 1, low: 2 };

const columns: ColumnDef<EventWithSignal>[] = [
  {
    accessorKey: 'event.title',
    header: () => <span className="text-zinc-400">Event</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="font-medium text-zinc-100">
          {row.original.event.title}
        </span>
        <CategoryBadge category={row.original.event.category} />
      </div>
    ),
  },
  {
    accessorKey: 'event.windowStart',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="text-zinc-400 hover:text-zinc-100 -ml-4"
      >
        Window
        {column.getIsSorted() === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => (
      <WindowStatus
        windowStart={row.original.event.windowStart}
        windowEnd={row.original.event.windowEnd}
      />
    ),
  },
  {
    accessorKey: 'stress.level',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="text-zinc-400 hover:text-zinc-100 -ml-4"
      >
        Stress
        {column.getIsSorted() === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => <StressBadge level={row.original.stress.level} />,
    sortingFn: (rowA, rowB) => {
      const a = stressOrder[rowA.original.stress.level] ?? 1;
      const b = stressOrder[rowB.original.stress.level] ?? 1;
      return a - b;
    },
  },
  {
    accessorKey: 'signal',
    header: () => <span className="text-zinc-400">Signal</span>,
    cell: ({ row }) => (
      <Sparkline data={row.original.signal} stressLevel={row.original.stress.level} />
    ),
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="h-8 w-8 p-0 hover:bg-zinc-800"
      >
        <Link href={`/events/${row.original.event.slug}`}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    ),
  },
];

const globalFilterFn = (row: { original: EventWithSignal }, _columnId: string, filterValue: string) => {
  const title = row.original.event.title.toLowerCase();
  return title.includes(filterValue.toLowerCase());
};

const categories: { value: string; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'macro', label: 'Macro' },
  { value: 'liquidity', label: 'Liquidity' },
  { value: 'protocol', label: 'Protocol' },
  { value: 'rwa', label: 'RWA' },
];

interface EventsTableProps {
  events: EventWithSignal[];
  stressFilter?: StressLevel | 'all';
  onStressFilterChange?: (level: StressLevel | 'all') => void;
}

export function EventsTable({ events, stressFilter = 'all', onStressFilterChange }: EventsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredData = useMemo(() => {
    return events.filter((item) => {
      const matchesCategory = categoryFilter === 'all' || item.event.category === categoryFilter;
      const matchesStress = stressFilter === 'all' || item.stress.level === stressFilter;
      return matchesCategory && matchesStress;
    });
  }, [events, categoryFilter, stressFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search events..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm bg-zinc-900 border-zinc-800"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-zinc-800 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-zinc-400">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-zinc-500 py-8">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-zinc-800 hover:bg-zinc-800/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
