"use client";

import { useState } from "react";

type Category = { id: string; name: string };
type Rule = { id: string; pattern: string; category_id: string; priority: number; category_name: string };

export function AdminClient({
  initialCategories,
  initialRules,
}: {
  initialCategories: Category[];
  initialRules: Rule[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [rules, setRules] = useState<Rule[]>([...initialRules].sort((a, b) => a.priority - b.priority));
  const [newCategory, setNewCategory] = useState("");
  const [newRulePattern, setNewRulePattern] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState(initialCategories[0]?.id ?? "");
  const [newRulePriority, setNewRulePriority] = useState(100);
  const [busy, setBusy] = useState(false);
  const [dragRuleId, setDragRuleId] = useState<string | null>(null);

  async function reload() {
    const [catRes, ruleRes] = await Promise.all([fetch("/api/categories"), fetch("/api/rules")]);
    const catData = await catRes.json();
    const ruleData = await ruleRes.json();
    setCategories(catData.categories ?? []);
    setRules((ruleData.rules ?? []).sort((a: Rule, b: Rule) => a.priority - b.priority));
  }

  async function createCategory() {
    if (!newCategory.trim()) return;
    setBusy(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory.trim() }),
    });
    setNewCategory("");
    await reload();
    setBusy(false);
  }

  async function updateCategory(id: string, name: string) {
    if (!name.trim()) return;
    await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await reload();
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    await reload();
  }

  async function createRule() {
    if (!newRulePattern.trim() || !newRuleCategory) return;
    setBusy(true);
    await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern: newRulePattern.trim(), category_id: newRuleCategory, priority: Number(newRulePriority) }),
    });
    setNewRulePattern("");
    setNewRulePriority(100);
    await reload();
    setBusy(false);
  }

  async function saveRule(rule: Rule) {
    await fetch(`/api/rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern: rule.pattern, category_id: rule.category_id, priority: rule.priority }),
    });
  }

  async function deleteRule(id: string) {
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
    await reload();
  }

  async function recategorize() {
    setBusy(true);
    await fetch("/api/admin/recategorize", { method: "POST" });
    setBusy(false);
  }

  async function reorderRules(dragId: string, targetId: string) {
    if (dragId === targetId) return;
    const list = [...rules];
    const dragIdx = list.findIndex((r) => r.id === dragId);
    const targetIdx = list.findIndex((r) => r.id === targetId);
    if (dragIdx < 0 || targetIdx < 0) return;
    const [moved] = list.splice(dragIdx, 1);
    list.splice(targetIdx, 0, moved);
    const next = list.map((rule, idx) => ({ ...rule, priority: (idx + 1) * 10 }));
    setRules(next);
    await Promise.all(next.map(saveRule));
  }

  return (
    <div className="admin-content">
      {/* Categories */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h3>Categories</h3>
          <div className="admin-add-row">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void createCategory(); }}
              placeholder="New category name…"
            />
            <button onClick={createCategory} disabled={busy} className="primary-btn btn-sm">Add</button>
          </div>
        </div>
        <div className="admin-flat-list">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} onSave={updateCategory} onDelete={deleteCategory} />
          ))}
        </div>
      </section>

      {/* Rules */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h3>Rules</h3>
          <button className="btn-link btn-sm" onClick={recategorize} disabled={busy}>
            {busy ? "Running…" : "Re-categorize all"}
          </button>
        </div>
        <div className="admin-rule-form">
          <input
            value={newRulePattern}
            onChange={(e) => setNewRulePattern(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void createRule(); }}
            placeholder="Merchant contains…"
          />
          <select value={newRuleCategory} onChange={(e) => setNewRuleCategory(e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            className="priority-chip"
            type="number"
            min={1}
            max={1000}
            value={newRulePriority}
            onChange={(e) => setNewRulePriority(Number(e.target.value))}
          />
          <button onClick={createRule} disabled={busy} className="primary-btn btn-sm">Add</button>
        </div>
        <div className="admin-flat-list">
          {rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              categories={categories}
              onSave={async (r) => { await saveRule(r); await reload(); }}
              onDelete={deleteRule}
              onDragStart={(id) => setDragRuleId(id)}
              onDrop={async (id) => {
                if (dragRuleId) await reorderRules(dragRuleId, id);
                setDragRuleId(null);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CategoryRow({
  category,
  onSave,
  onDelete,
}: {
  category: Category;
  onSave: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(category.name);
  return (
    <div className="admin-flat-row admin-cat-row">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => { if (name !== category.name) void onSave(category.id, name); }}
      />
      <button
        className="del-btn"
        onClick={() => onDelete(category.id)}
        disabled={category.name === "Uncategorized"}
      >×</button>
    </div>
  );
}

function RuleRow({
  rule,
  categories,
  onSave,
  onDelete,
  onDragStart,
  onDrop,
}: {
  rule: Rule;
  categories: Category[];
  onSave: (rule: Rule) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => Promise<void>;
}) {
  const [local, setLocal] = useState(rule);

  return (
    <div
      className="admin-flat-row admin-rule-row"
      draggable
      onDragStart={() => onDragStart(local.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => void onDrop(local.id)}
    >
      <span className="drag-handle">⋮⋮</span>
      <input
        value={local.pattern}
        onChange={(e) => setLocal((p) => ({ ...p, pattern: e.target.value }))}
        onBlur={() => void onSave(local)}
      />
      <select
        value={local.category_id}
        onChange={(e) => {
          const next = { ...local, category_id: e.target.value };
          setLocal(next);
          void onSave(next);
        }}
      >
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input
        className="priority-chip"
        type="number"
        min={1}
        max={1000}
        value={local.priority}
        onChange={(e) => setLocal((p) => ({ ...p, priority: Number(e.target.value) }))}
        onBlur={() => void onSave(local)}
      />
      <button className="del-btn" onClick={() => onDelete(local.id)}>×</button>
    </div>
  );
}
