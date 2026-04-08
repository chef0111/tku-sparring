import type { Cell, RowData, TableMeta } from '@tanstack/react-table';

export type Direction = 'ltr' | 'rtl';

export type RowHeightValue = 'short' | 'medium' | 'tall' | 'extra-tall';

export interface CellSelectOption {
  label: string;
  value: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  count?: number;
}

// ── Validation ────────────────────────────────────────────────────────

/**
 * Per-cell validation function. Receives the current cell value
 * and returns an error message string, or `null` / `undefined` if valid.
 */
export type CellValidateFn = (value: unknown) => string | null | undefined;

/**
 * Common validation fields applicable to every cell variant.
 * These are intersected into each variant of `CellOpts`.
 */
export interface CellValidation {
  /** When `true`, the cell must have a non-empty value before the row can be committed. */
  required?: boolean;
  /** Custom validator. Takes precedence over `required` when provided (but both run). */
  validate?: CellValidateFn;
}

// ── Cell options ──────────────────────────────────────────────────────

export type CellOpts =
  | ({
      variant: 'short-text';
    } & CellValidation)
  | ({
      variant: 'long-text';
    } & CellValidation)
  | ({
      variant: 'number';
      min?: number;
      max?: number;
      step?: number;
    } & CellValidation)
  | ({
      variant: 'select';
      options: Array<CellSelectOption>;
    } & CellValidation)
  | ({
      variant: 'multi-select';
      options: Array<CellSelectOption>;
    } & CellValidation)
  | ({
      variant: 'checkbox';
    } & CellValidation)
  | ({
      variant: 'date';
    } & CellValidation)
  | ({
      variant: 'url';
    } & CellValidation)
  | ({
      variant: 'file';
      maxFileSize?: number;
      maxFiles?: number;
      accept?: string;
      multiple?: boolean;
    } & CellValidation);

export interface CellUpdate {
  rowIndex: number;
  columnId: string;
  value: unknown;
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    cell?: CellOpts;
  }

  interface TableMeta<TData extends RowData> {
    dataGridRef?: React.RefObject<HTMLElement | null>;
    cellMapRef?: React.RefObject<Map<string, HTMLDivElement>>;
    focusedCell?: CellPosition | null;
    editingCell?: CellPosition | null;
    selectionState?: SelectionState;
    searchOpen?: boolean;
    getIsCellSelected?: (rowIndex: number, columnId: string) => boolean;
    getIsSearchMatch?: (rowIndex: number, columnId: string) => boolean;
    getIsActiveSearchMatch?: (rowIndex: number, columnId: string) => boolean;
    getVisualRowIndex?: (rowId: string) => number | undefined;
    rowHeight?: RowHeightValue;
    onRowHeightChange?: (value: RowHeightValue) => void;
    onRowSelect?: (
      rowIndex: number,
      checked: boolean,
      shiftKey: boolean
    ) => void;
    onDataUpdate?: (params: CellUpdate | Array<CellUpdate>) => void;
    onRowsDelete?: (rowIndices: Array<number>) => void | Promise<void>;
    onColumnClick?: (columnId: string) => void;
    onCellClick?: (
      rowIndex: number,
      columnId: string,
      event?: React.MouseEvent
    ) => void;
    onCellDoubleClick?: (rowIndex: number, columnId: string) => void;
    onCellMouseDown?: (
      rowIndex: number,
      columnId: string,
      event: React.MouseEvent
    ) => void;
    onCellMouseEnter?: (rowIndex: number, columnId: string) => void;
    onCellMouseUp?: () => void;
    onCellContextMenu?: (
      rowIndex: number,
      columnId: string,
      event: React.MouseEvent
    ) => void;
    onCellEditingStart?: (rowIndex: number, columnId: string) => void;
    onCellEditingStop?: (opts?: {
      direction?: NavigationDirection;
      moveToNextRow?: boolean;
    }) => void;
    onCellsCopy?: () => void;
    onCellsCut?: () => void;
    onCellsPaste?: (expand?: boolean) => void;
    onSelectionClear?: () => void;
    onFilesUpload?: (params: {
      files: Array<File>;
      rowIndex: number;
      columnId: string;
    }) => Promise<Array<FileCellData>>;
    onFilesDelete?: (params: {
      fileIds: Array<string>;
      rowIndex: number;
      columnId: string;
    }) => void | Promise<void>;
    contextMenu?: ContextMenuState;
    onContextMenuOpenChange?: (open: boolean) => void;
    pasteDialog?: PasteDialogState;
    onPasteDialogOpenChange?: (open: boolean) => void;
    readOnly?: boolean;

    // ── Validation ─────────────────────────────────────────
    /** Whether a given row is a local-only (uncommitted) row. */
    getIsLocalRow?: (rowIndex: number) => boolean;
    /** Returns the validation error message for a cell, or `undefined` if valid. */
    getCellError?: (rowIndex: number, columnId: string) => string | undefined;
    /** Validate every cell in a row. Returns `true` if the entire row is valid. */
    validateRow?: (rowIndex: number) => boolean;
    /** Commit (persist) a local row after it passes validation. */
    commitRow?: (rowIndex: number) => void | Promise<void>;
    /** Discard a local row without persisting. */
    discardRow?: (rowIndex: number) => void;
  }
}

export interface CellPosition {
  rowIndex: number;
  columnId: string;
}

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

export interface SelectionState {
  selectedCells: Set<string>;
  selectionRange: CellRange | null;
  isSelecting: boolean;
}

export interface ContextMenuState {
  open: boolean;
  x: number;
  y: number;
}

export interface PasteDialogState {
  open: boolean;
  rowsNeeded: number;
  clipboardText: string;
}

export type NavigationDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'home'
  | 'end'
  | 'ctrl+up'
  | 'ctrl+down'
  | 'ctrl+home'
  | 'ctrl+end'
  | 'pageup'
  | 'pagedown'
  | 'pageleft'
  | 'pageright';

export interface SearchState {
  searchMatches: Array<CellPosition>;
  matchIndex: number;
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onNavigateToNextMatch: () => void;
  onNavigateToPrevMatch: () => void;
}

export interface DataGridCellProps<TData> {
  cell: Cell<TData, unknown>;
  tableMeta: TableMeta<TData>;
  rowIndex: number;
  columnId: string;
  rowHeight: RowHeightValue;
  isEditing: boolean;
  isFocused: boolean;
  isSelected: boolean;
  isSearchMatch: boolean;
  isActiveSearchMatch: boolean;
  readOnly: boolean;
}

export interface FileCellData {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export type TextFilterOperator =
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'notEquals'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty'
  | 'isNotEmpty';

export type NumberFilterOperator =
  | 'equals'
  | 'notEquals'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'isBetween'
  | 'isEmpty'
  | 'isNotEmpty';

export type DateFilterOperator =
  | 'equals'
  | 'notEquals'
  | 'before'
  | 'after'
  | 'onOrBefore'
  | 'onOrAfter'
  | 'isBetween'
  | 'isEmpty'
  | 'isNotEmpty';

export type SelectFilterOperator =
  | 'is'
  | 'isNot'
  | 'isAnyOf'
  | 'isNoneOf'
  | 'isEmpty'
  | 'isNotEmpty';

export type BooleanFilterOperator = 'isTrue' | 'isFalse';

export type FilterOperator =
  | TextFilterOperator
  | NumberFilterOperator
  | DateFilterOperator
  | SelectFilterOperator
  | BooleanFilterOperator;

export interface FilterValue {
  operator: FilterOperator;
  value?: string | number | Array<string>;
  endValue?: string | number;
}
