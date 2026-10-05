import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import { copy } from "@/lib/document/copy";
import {
  addColumn,
  addRow,
  hasRowNumbers,
  moveColumn,
  moveRow,
  removeColumn,
  removeRow,
  setCell,
  setHeader,
  type TableData,
} from "@/lib/document/model";
import { RichField, RichRead } from "./rich-text";

const quiet =
  "inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-medium text-muted hover:bg-paper hover:text-ink disabled:opacity-40";

export function ChartTable({
  table,
  editing,
  onChange,
  variant,
}: {
  table: TableData;
  editing: boolean;
  onChange: (next: TableData) => void;
  variant: "interaction" | "checklist";
}) {
  const numbered = hasRowNumbers(table.headers);
  const [widths, setWidths] = useState<Record<string, number>>(table.columnWidths ?? {});
  const widthsRef = useRef(widths);
  widthsRef.current = widths;

  useEffect(() => {
    setWidths(table.columnWidths ?? {});
  }, [table.id, table.headers.length, table.columnWidths]);

  const widthOf = (index: number) => {
    const saved = widths[String(index)];
    if (typeof saved === "number") return saved;
    return index === 0 ? 72 : 180;
  };

  const startResize = (event: ReactPointerEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    const pointerId = event.pointerId;
    handle.setPointerCapture(pointerId);
    const startX = event.clientX;
    const startWidth = widthOf(index);
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const next = Math.max(64, Math.round(startWidth + ev.clientX - startX));
      setWidths((current) => {
        const updated = { ...current, [String(index)]: next };
        widthsRef.current = updated;
        return updated;
      });
    };
    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      onChange({ ...table, columnWidths: widthsRef.current });
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
  };

  return (
    <div className="mt-4">
      {editing ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button type="button" className={quiet} onClick={() => onChange(addColumn(table))}>
              <Plus className="size-4" /> Column
            </button>
            <button
              type="button"
              className={quiet}
              disabled={table.headers.length <= 1}
              onClick={() => onChange(removeColumn(table))}
            >
              <Minus className="size-4" />
            </button>
          </div>
          <span className="text-line" aria-hidden>
            |
          </span>
          <div className="flex items-center gap-1">
            <button type="button" className={quiet} onClick={() => onChange(addRow(table))}>
              <Plus className="size-4" /> Row
            </button>
            <button
              type="button"
              className={quiet}
              disabled={table.rows.length <= 1}
              onClick={() => onChange(removeRow(table))}
            >
              <Minus className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
      <div className="chart-scroll overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {editing ? <th className="focus-only w-12 border border-line bg-paper" /> : null}
              {table.headers.map((header, index) => (
                <th
                  key={`header-${index}`}
                  className="relative border border-line bg-paper px-2 py-2 text-left align-top font-semibold text-ink"
                  style={variant === "interaction" ? { width: widthOf(index), minWidth: widthOf(index) } : undefined}
                >
                  {editing && variant === "interaction" ? (
                    <div className="focus-only mb-1 flex">
                      <button
                        type="button"
                        className={quiet}
                        aria-label="Move column left"
                        disabled={index === 0}
                        onClick={() => onChange(moveColumn(table, index, index - 1))}
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        className={quiet}
                        aria-label="Move column right"
                        disabled={index === table.headers.length - 1}
                        onClick={() => onChange(moveColumn(table, index, index + 1))}
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  ) : null}
                  {editing ? (
                    index === 0 && numbered ? (
                      <span className="px-1 text-muted">#</span>
                    ) : (
                      <RichField
                        value={header}
                        ariaLabel={`Column ${index + 1} header`}
                        placeholder={copy.column}
                        singleLine
                        onChange={(value) => onChange(setHeader(table, index, value))}
                      />
                    )
                  ) : (
                    <RichRead value={header} placeholder={copy.column} />
                  )}
                  {editing && variant === "interaction" ? (
                    <div
                      className="absolute top-0 right-0 h-full w-3 cursor-col-resize touch-none"
                      onPointerDown={(event) => startResize(event, index)}
                      aria-hidden
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className={rowIndex % 2 === 1 ? "bg-paper/60" : ""}>
                {editing ? (
                  <td className="focus-only border border-line align-top">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        className={quiet}
                        aria-label="Move row up"
                        disabled={rowIndex === 0}
                        onClick={() => onChange(moveRow(table, rowIndex, rowIndex - 1))}
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        className={quiet}
                        aria-label="Move row down"
                        disabled={rowIndex === table.rows.length - 1}
                        onClick={() => onChange(moveRow(table, rowIndex, rowIndex + 1))}
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    </div>
                  </td>
                ) : null}
                {table.headers.map((_, cellIndex) => (
                  <td
                    key={`cell-${rowIndex}-${cellIndex}`}
                    className="border border-line px-2 py-2 align-top"
                    style={
                      variant === "interaction" ? { width: widthOf(cellIndex), minWidth: widthOf(cellIndex) } : undefined
                    }
                  >
                    {cellIndex === 0 && numbered ? (
                      <span className="px-1 text-muted tabular-nums">{rowIndex + 1}</span>
                    ) : editing ? (
                      <RichField
                        value={row[cellIndex] ?? ""}
                        ariaLabel={`Row ${rowIndex + 1} column ${cellIndex + 1}`}
                        placeholder={copy.cell}
                        onChange={(value) => onChange(setCell(table, rowIndex, cellIndex, value))}
                      />
                    ) : (
                      <RichRead value={row[cellIndex] ?? ""} placeholder={copy.cell} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
