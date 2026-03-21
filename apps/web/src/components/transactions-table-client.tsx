"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";

type Category = { id: string; name: string };

type TxItem = {
  id: string;
  posted_at: string;
  amount_aed: string;
  merchant: string;
  category_name: string | null;
  category_id: string | null;
  is_excluded: boolean;
};

type TxResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalAmount: number;
  items: TxItem[];
};

type Filters = {
  fromMonth: string;
  toMonth: string;
  categories: string[];
  merchant: string;
  min: string;
  max: string;
  sort: "posted_at_desc" | "posted_at_asc" | "amount_desc" | "amount_asc";
};

type EditDraft = {
  merchant: string;
  amountAed: string;
  categoryId: string;
  isExcluded: boolean;
};

type CreateDraft = {
  postedAt: string;
  merchant: string;
  amountAed: string;
  categoryId: string;
  isExcluded: boolean;
};

function lastDayOfMonth(yearMonth: string) {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function currentDateInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function isPositiveAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function emptyCreateDraft(): CreateDraft {
  return {
    postedAt: currentDateInput(),
    merchant: "",
    amountAed: "",
    categoryId: "",
    isExcluded: false,
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getUTCDate()).padStart(2, "0")} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function TransactionsTableClient({
  categories,
  initialData,
}: {
  categories: Category[];
  initialData: TxResponse;
}) {
  const [filters, setFilters] = useState<Filters>({
    fromMonth: "",
    toMonth: "",
    categories: [],
    merchant: "",
    min: "",
    max: "",
    sort: "posted_at_desc",
  });
  const [data, setData] = useState<TxResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateDraft>(emptyCreateDraft);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const pages = useMemo(() => {
    const from = Math.max(1, data.page - 2);
    const to = Math.min(totalPages, data.page + 2);
    const out: number[] = [];
    for (let i = from; i <= to; i++) out.push(i);
    return out;
  }, [data.page, totalPages]);

  const canSaveEdit =
    !!editDraft &&
    editDraft.merchant.trim().length > 0 &&
    isPositiveAmount(editDraft.amountAed);
  const canCreate =
    createDraft.postedAt.length > 0 &&
    createDraft.merchant.trim().length > 0 &&
    isPositiveAmount(createDraft.amountAed);

  function buildQuery(page: number, f: Filters) {
    const q = new URLSearchParams({
      page: String(page),
      pageSize: String(data.pageSize),
      sort: f.sort,
    });
    if (f.fromMonth) q.set("from", `${f.fromMonth}-01`);
    if (f.toMonth) {
      const last = lastDayOfMonth(f.toMonth);
      q.set("to", `${f.toMonth}-${String(last).padStart(2, "0")}`);
    }
    if (f.categories.length > 0) q.set("category", f.categories.join(","));
    if (f.merchant) q.set("merchant", f.merchant);
    if (f.min) q.set("min", f.min);
    if (f.max) q.set("max", f.max);
    return q.toString();
  }

  async function fetchPage(page: number, f = filters) {
    setLoading(true);
    const res = await fetch(`/api/transactions?${buildQuery(page, f)}`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }

  function triggerFetch(next: Filters, immediate = false) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void fetchPage(1, next), immediate ? 0 : 450);
  }

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K], immediate = false) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    triggerFetch(next, immediate);
  }

  function openEdit(item: TxItem) {
    setShowCreateForm(false);
    setFormError(null);
    setExpandedId(item.id);
    setEditDraft({
      merchant: item.merchant,
      amountAed: item.amount_aed,
      categoryId: item.category_id ?? "",
      isExcluded: item.is_excluded,
    });
  }

  function closeEdit() {
    setExpandedId(null);
    setEditDraft(null);
    setFormError(null);
  }

  function toggleCreateForm() {
    setExpandedId(null);
    setEditDraft(null);
    setFormError(null);
    setShowCreateForm((open) => {
      const next = !open;
      if (next) {
        setCreateDraft(emptyCreateDraft());
      }
      return next;
    });
  }

  async function handleSave(itemId: string) {
    if (!editDraft || !canSaveEdit) return;
    setSaving(true);
    setFormError(null);
    const res = await fetch(`/api/transactions/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: editDraft.merchant.trim(),
        amountAed: Number(editDraft.amountAed),
        categoryId: editDraft.categoryId || null,
        isExcluded: editDraft.isExcluded,
      }),
    });
    if (!res.ok) {
      setFormError("Could not save transaction changes.");
      setSaving(false);
      return;
    }
    await fetchPage(data.page);
    closeEdit();
    setSaving(false);
  }

  async function handleDelete(itemId: string) {
    setSaving(true);
    setFormError(null);
    const res = await fetch(`/api/transactions/${itemId}`, { method: "DELETE" });
    if (!res.ok) {
      setFormError("Could not delete this transaction.");
      setSaving(false);
      return;
    }
    await fetchPage(data.page);
    closeEdit();
    setSaving(false);
  }

  async function handleCreate() {
    if (!canCreate) return;
    setCreating(true);
    setFormError(null);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postedAt: createDraft.postedAt,
        merchant: createDraft.merchant.trim(),
        amountAed: Number(createDraft.amountAed),
        ...(createDraft.categoryId ? { categoryId: createDraft.categoryId } : {}),
        isExcluded: createDraft.isExcluded,
      }),
    });
    if (!res.ok) {
      setFormError("Could not create the manual transaction.");
      setCreating(false);
      return;
    }
    await fetchPage(1);
    setShowCreateForm(false);
    setCreateDraft(emptyCreateDraft());
    setCreating(false);
  }

  return (
    <section className="ledger-section">
      <div className="section-header">
        <h2 className="section-title">Transactions</h2>
        <div className="inline-row">
          <div className="ledger-summary">
            {loading ? (
              <span className="ledger-count">Loading…</span>
            ) : (
              <>
                <span className="ledger-amount">
                  AED {data.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="ledger-count">{data.total} transactions</span>
              </>
            )}
          </div>
          <button
            type="button"
            className={`btn-sm ${showCreateForm ? "cancel-btn" : "primary-btn"}`}
            onClick={toggleCreateForm}
          >
            {showCreateForm ? "Close" : "Add Transaction"}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="create-panel">
          <div className="edit-panel">
            <label className="edit-field">
              <span>Date</span>
              <input
                type="date"
                value={createDraft.postedAt}
                onChange={(e) => setCreateDraft({ ...createDraft, postedAt: e.target.value })}
              />
            </label>
            <label className="edit-field">
              <span>Merchant</span>
              <input
                type="text"
                value={createDraft.merchant}
                onChange={(e) => setCreateDraft({ ...createDraft, merchant: e.target.value })}
                placeholder="Merchant name"
              />
            </label>
            <label className="edit-field">
              <span>Amount (AED)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={createDraft.amountAed}
                onChange={(e) => setCreateDraft({ ...createDraft, amountAed: e.target.value })}
                placeholder="0.00"
              />
            </label>
            <label className="edit-field">
              <span>Category</span>
              <select
                value={createDraft.categoryId}
                onChange={(e) => setCreateDraft({ ...createDraft, categoryId: e.target.value })}
              >
                <option value="">Auto / Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="exclude-toggle">
              <input
                type="checkbox"
                checked={createDraft.isExcluded}
                onChange={(e) => setCreateDraft({ ...createDraft, isExcluded: e.target.checked })}
              />
              <span>Exclude from KPIs &amp; graphs</span>
            </label>
            <div className="edit-panel-actions">
              <button
                type="button"
                className="primary-btn btn-sm"
                disabled={creating || !canCreate}
                onClick={() => void handleCreate()}
              >
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                className="cancel-btn btn-sm"
                disabled={creating}
                onClick={toggleCreateForm}
              >
                Cancel
              </button>
            </div>
          </div>
          {formError ? <p className="error transaction-form-error">{formError}</p> : null}
        </div>
      )}

      <div className="filter-grid">
        <input
          type="text"
          placeholder="Search merchant…"
          value={filters.merchant}
          onChange={(e) => updateFilter("merchant", e.target.value)}
        />
        <CategorySelect
          categories={categories}
          selected={filters.categories}
          onChange={(ids) => updateFilter("categories", ids, true)}
        />
        <select
          value={filters.sort}
          onChange={(e) => updateFilter("sort", e.target.value as Filters["sort"], true)}
        >
          <option value="posted_at_desc">Newest first</option>
          <option value="posted_at_asc">Oldest first</option>
          <option value="amount_desc">Amount ↓</option>
          <option value="amount_asc">Amount ↑</option>
        </select>
      </div>

      <div className="filter-grid-row2">
        <input
          type="month"
          value={filters.fromMonth}
          onChange={(e) => updateFilter("fromMonth", e.target.value, true)}
        />
        <input
          type="month"
          value={filters.toMonth}
          onChange={(e) => updateFilter("toMonth", e.target.value, true)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Min AED"
          value={filters.min}
          onChange={(e) => updateFilter("min", e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Max AED"
          value={filters.max}
          onChange={(e) => updateFilter("max", e.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Merchant</th>
              <th>Category</th>
              <th style={{ textAlign: "right" }}>Amount (AED)</th>
              <th className="action-col"></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <Fragment key={item.id}>
                <tr className={`${item.is_excluded ? "row-excluded" : ""} ${expandedId === item.id ? "row-active" : ""}`}>
                  <td className="date-cell">{formatDate(item.posted_at)}</td>
                  <td className="merchant-cell">{item.merchant}</td>
                  <td>
                    <span className={`badge ${categoryBadge(item.category_name ?? "Uncategorized")}`}>
                      {item.category_name ?? "Uncategorized"}
                    </span>
                  </td>
                  <td className="amount-cell">
                    {Number(item.amount_aed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="action-col">
                    <button
                      type="button"
                      className="row-edit-btn"
                      title="Edit transaction"
                      onClick={() => (expandedId === item.id ? closeEdit() : openEdit(item))}
                    >
                      ⋯
                    </button>
                  </td>
                </tr>
                {expandedId === item.id && editDraft && (
                  <tr className="edit-row">
                    <td colSpan={5}>
                      <div className="edit-panel">
                        <label className="edit-field">
                          <span>Merchant</span>
                          <input
                            type="text"
                            value={editDraft.merchant}
                            onChange={(e) => setEditDraft({ ...editDraft, merchant: e.target.value })}
                          />
                        </label>
                        <label className="edit-field">
                          <span>Amount (AED)</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={editDraft.amountAed}
                            onChange={(e) => setEditDraft({ ...editDraft, amountAed: e.target.value })}
                          />
                        </label>
                        <label className="edit-field">
                          <span>Category</span>
                          <select
                            value={editDraft.categoryId}
                            onChange={(e) => setEditDraft({ ...editDraft, categoryId: e.target.value })}
                          >
                            <option value="">Uncategorized</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </label>
                        <label className="exclude-toggle">
                          <input
                            type="checkbox"
                            checked={editDraft.isExcluded}
                            onChange={(e) => setEditDraft({ ...editDraft, isExcluded: e.target.checked })}
                          />
                          <span>Exclude from KPIs &amp; graphs</span>
                        </label>
                        <div className="edit-panel-actions">
                          <button
                            type="button"
                            className="primary-btn btn-sm"
                            disabled={saving || !canSaveEdit}
                            onClick={() => void handleSave(item.id)}
                          >
                            {saving ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            className="cancel-btn btn-sm"
                            disabled={saving}
                            onClick={closeEdit}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="del-btn-row btn-sm"
                            disabled={saving}
                            onClick={() => void handleDelete(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {formError ? <p className="error transaction-form-error">{formError}</p> : null}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pager-row">
        <span className="ledger-count">Showing {data.items.length} of {data.total}</span>
        <div className="pager">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={p === data.page ? "page-link active" : "page-link"}
              onClick={() => void fetchPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategorySelect({
  categories,
  selected,
  onChange,
}: {
  categories: Category[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const label =
    selected.length === 0
      ? "All categories"
      : selected.length === 1
        ? (categories.find((c) => c.id === selected[0])?.name ?? "1 category")
        : `${selected.length} categories`;

  function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    onChange(next);
  }

  return (
    <div className="ms-wrap" ref={ref}>
      <button type="button" className="ms-trigger" onClick={() => setOpen((x) => !x)}>
        <span>{label}</span>
        <svg className={`ms-chevron${open ? " open" : ""}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="ms-dropdown">
          <button
            type="button"
            className={`ms-option${selected.length === 0 ? " ms-option-active" : ""}`}
            onClick={() => onChange([])}
          >
            <span className="ms-check">{selected.length === 0 ? "✓" : ""}</span>
            All categories
          </button>
          {categories.map((c) => {
            const checked = selected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`ms-option${checked ? " ms-option-active" : ""}`}
                onClick={() => toggle(c.id)}
              >
                <span className="ms-check">{checked ? "✓" : ""}</span>
                {c.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function categoryBadge(category: string) {
  const key = category.toLowerCase();
  if (key.includes("bill")) return "badge-bills";
  if (key.includes("dining")) return "badge-dining";
  if (key.includes("grocer")) return "badge-grocery";
  if (key.includes("shop")) return "badge-shopping";
  if (key.includes("transport")) return "badge-transport";
  return "badge-default";
}
