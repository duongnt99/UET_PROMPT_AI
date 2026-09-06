"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import {
  activateRubricAction,
  cloneRubricAction,
  saveRubricAction,
  type RubricActionState,
} from "@/server/actions/admin-rubric-actions";
import type { RubricCriterionInput } from "@/server/domain/rubric";

const idle: RubricActionState = { ok: true, message: "" };

type Row = RubricCriterionInput & { key: string };

function newKey() {
  return crypto.randomUUID();
}

function toRow(item: RubricCriterionInput): Row {
  return { ...item, key: item.id || newKey() };
}

function emptyCriterion(): Row {
  return {
    key: newKey(),
    id: "",
    code: "",
    titleVi: "",
    titleEn: "",
    description: "",
    guidance: "",
    weight: "0",
    minScore: "0",
    maxScore: "10",
    scoreStep: "0.5",
    isRequired: true,
  };
}

function Feedback({ state, pending }: { state: RubricActionState; pending: boolean }) {
  if (pending) return <p className="text-sm text-slate-600">Đang lưu…</p>;
  if (!state.message) return null;
  return (
    <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
      {state.message}
    </p>
  );
}

function weightSum(rows: Row[]) {
  return rows.reduce((sum, row) => sum + (Number(row.weight) || 0), 0);
}

export function RubricEditorForm({
  rubric,
  competitions,
  mutable,
  initialCriteria,
}: {
  rubric?: {
    id: string;
    name: string;
    stage: string;
    competitionId: string;
    isActive: boolean;
    versionNumber: number;
    criteria: RubricCriterionInput[];
  };
  competitions: { id: string; name: string; isRehearsal: boolean }[];
  mutable: boolean;
  initialCriteria?: RubricCriterionInput[];
}) {
  const [state, action, pending] = useActionState(saveRubricAction, idle);
  const [rows, setRows] = useState<Row[]>(() => {
    const source = rubric?.criteria.length ? rubric.criteria : initialCriteria;
    return source?.length ? source.map(toRow) : [emptyCriterion()];
  });
  const sum = useMemo(() => weightSum(rows), [rows]);
  const sumOk = Math.abs(sum - 100) < 0.0001;

  function update(key: string, patch: Partial<Row>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  return (
    <form action={action} className="space-y-4">
      {rubric ? <input type="hidden" name="id" value={rubric.id} /> : null}
      <input
        type="hidden"
        name="criteriaJson"
        value={JSON.stringify(rows.map(({ key, ...item }) => {
          void key;
          return item;
        }))}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Tên rubric</Label>
          <Input id="name" name="name" required defaultValue={rubric?.name} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="stage">Vòng</Label>
          <select
            id="stage"
            name="stage"
            defaultValue={rubric?.stage ?? "AUDITION"}
            disabled={Boolean(rubric)}
            className="mt-1 h-11 w-full rounded-xl border px-3"
          >
            <option value="AUDITION">Audition</option>
            <option value="FINAL">Chung kết</option>
          </select>
          {rubric ? <input type="hidden" name="stage" value={rubric.stage} /> : null}
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="competitionId">Cuộc thi</Label>
          <select
            id="competitionId"
            name="competitionId"
            defaultValue={rubric?.competitionId ?? competitions[0]?.id}
            disabled={Boolean(rubric)}
            className="mt-1 h-11 w-full rounded-xl border px-3"
          >
            {competitions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.isRehearsal ? " (rehearsal)" : ""}
              </option>
            ))}
          </select>
          {rubric ? <input type="hidden" name="competitionId" value={rubric.competitionId} /> : null}
        </div>
      </div>

      {!mutable && rubric ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Phiên bản v{rubric.versionNumber} đã được gán để chấm. Sửa tiêu chí ở đây sẽ bị từ chối — hãy tạo phiên bản
          mới, chỉnh, rồi kích hoạt.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Tiêu chí</h2>
        <p className={`text-sm ${sumOk ? "text-emerald-700" : "text-red-700"}`}>Tổng trọng số: {sum}%</p>
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => (
          <fieldset key={row.key} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <legend className="px-1 text-sm font-semibold">Tiêu chí {index + 1}</legend>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor={`titleVi-${row.key}`}>Tên (VI)</Label>
                <Input
                  id={`titleVi-${row.key}`}
                  value={row.titleVi}
                  onChange={(event) => update(row.key, { titleVi: event.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`titleEn-${row.key}`}>Tên (EN)</Label>
                <Input
                  id={`titleEn-${row.key}`}
                  value={row.titleEn}
                  onChange={(event) => update(row.key, { titleEn: event.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`code-${row.key}`}>Mã</Label>
                <Input
                  id={`code-${row.key}`}
                  value={row.code}
                  onChange={(event) => update(row.key, { code: event.target.value })}
                  placeholder="Tự tạo từ tên nếu để trống"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`weight-${row.key}`}>Trọng số (%)</Label>
                <Input
                  id={`weight-${row.key}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.weight}
                  onChange={(event) => update(row.key, { weight: event.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`min-${row.key}`}>Điểm min</Label>
                <Input
                  id={`min-${row.key}`}
                  type="number"
                  step="0.1"
                  value={row.minScore}
                  onChange={(event) => update(row.key, { minScore: event.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`max-${row.key}`}>Điểm max</Label>
                <Input
                  id={`max-${row.key}`}
                  type="number"
                  step="0.1"
                  value={row.maxScore}
                  onChange={(event) => update(row.key, { maxScore: event.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`step-${row.key}`}>Bước điểm</Label>
                <Input
                  id={`step-${row.key}`}
                  type="number"
                  step="0.1"
                  value={row.scoreStep}
                  onChange={(event) => update(row.key, { scoreStep: event.target.value })}
                  className="mt-1"
                />
              </div>
              <label className="mt-6 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.isRequired}
                  onChange={(event) => update(row.key, { isRequired: event.target.checked })}
                />
                Bắt buộc
              </label>
            </div>
            <div>
              <Label htmlFor={`desc-${row.key}`}>Mô tả</Label>
              <Textarea
                id={`desc-${row.key}`}
                value={row.description}
                onChange={(event) => update(row.key, { description: event.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`guide-${row.key}`}>Hướng dẫn chấm</Label>
              <Textarea
                id={`guide-${row.key}`}
                value={row.guidance}
                onChange={(event) => update(row.key, { guidance: event.target.value })}
                className="mt-1"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={rows.length <= 1}
              onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
            >
              Xóa tiêu chí
            </Button>
          </fieldset>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={() => setRows((current) => [...current, emptyCriterion()])}>
        Thêm tiêu chí
      </Button>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || !mutable}>
          {pending ? "Đang lưu…" : rubric ? "Lưu thay đổi" : "Tạo rubric"}
        </Button>
      </div>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function RubricVersionActions({
  rubricId,
  isActive,
}: {
  rubricId: string;
  isActive: boolean;
}) {
  const [cloneState, cloneAction, clonePending] = useActionState(cloneRubricAction, idle);
  const [activateState, activateAction, activatePending] = useActionState(activateRubricAction, idle);
  return (
    <div className="flex flex-wrap gap-2">
      <form action={cloneAction}>
        <input type="hidden" name="rubricId" value={rubricId} />
        <Button type="submit" variant="outline" disabled={clonePending}>
          {clonePending ? "Đang tạo…" : "Tạo phiên bản mới"}
        </Button>
      </form>
      {isActive ? null : (
        <form action={activateAction}>
          <input type="hidden" name="rubricId" value={rubricId} />
          <Button type="submit" variant="accent" disabled={activatePending}>
            {activatePending ? "Đang kích hoạt…" : "Kích hoạt phiên bản này"}
          </Button>
        </form>
      )}
      <Feedback state={cloneState} pending={clonePending} />
      <Feedback state={activateState} pending={activatePending} />
    </div>
  );
}
