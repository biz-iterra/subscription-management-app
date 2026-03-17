"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useCategories, usePaymentMethods, useReminderSettings } from "@/hooks/useSettings";
import { CATEGORY_COLORS } from "@/lib/constants";
import { Check, Edit, Plus, Trash2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <Header title="設定" />
      <div className="p-6 space-y-6 max-w-2xl">
        <ReminderSection />
        <PaymentMethodsSection />
        <CategoriesSection />
      </div>
    </>
  );
}

function ReminderSection() {
  const { settings, loading, update } = useReminderSettings();
  const [days, setDays] = useState<number | null>(null);
  const [emailEnabled, setEmailEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentDays = days ?? settings?.days_before ?? 3;
  const currentEmail = emailEnabled ?? settings?.email_enabled ?? true;

  const handleSave = async () => {
    setSaving(true);
    await update({ days_before: currentDays, email_enabled: currentEmail });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <CardHeader><CardTitle>リマインド設定</CardTitle></CardHeader>
      {loading ? <LoadingSpinner size="sm" /> : (
        <div className="space-y-5">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="days-range" className="text-sm text-zinc-700">何日前に通知するか</label>
              <span className="text-sm font-bold text-primary-600 tabnum">{currentDays}日前</span>
            </div>
            <input id="days-range" type="range" min="1" max="30" value={currentDays} onChange={(e) => setDays(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary-500"
              aria-valuemin={1} aria-valuemax={30} aria-valuenow={currentDays} />
            <div className="flex justify-between text-xs text-zinc-400">
              <span>1日前</span><span>30日前</span>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${currentEmail ? "bg-primary-500 border-primary-500" : "border-zinc-300 group-hover:border-primary-400"}`}>
              <input type="checkbox" checked={currentEmail} onChange={(e) => setEmailEnabled(e.target.checked)} className="sr-only" />
              {currentEmail && <Check size={12} className="text-white" aria-hidden="true" />}
            </div>
            <span className="text-sm text-zinc-700">メール通知を受け取る</span>
          </label>

          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : saved ? <><Check size={13} aria-hidden="true" />保存しました</> : "保存する"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function PaymentMethodsSection() {
  const { paymentMethods, loading, create, update, remove } = usePaymentMethods();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <CardTitle>支払い方法</CardTitle>
        <Button size="sm" onClick={() => { setName(""); setAddOpen(true); }}>
          <Plus size={14} aria-hidden="true" />追加
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : paymentMethods.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-sm">支払い方法が登録されていません</div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {paymentMethods.map((pm) => (
            <li key={pm.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50">
              <span className="text-sm text-zinc-800">{pm.name}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditTarget(pm); setName(pm.name); }} aria-label={`${pm.name}を編集`}><Edit size={14} aria-hidden="true" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(pm.id)} aria-label={`${pm.name}を削除`} className="text-zinc-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} aria-hidden="true" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="支払い方法を追加" size="sm">
        <div className="space-y-4">
          <Input label="名前" placeholder="例: クレジットカード" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>キャンセル</Button>
            <Button className="flex-1" onClick={async () => { if (!name.trim()) return; setSaving(true); await create({ name: name.trim() }); setName(""); setAddOpen(false); setSaving(false); }} disabled={saving || !name.trim()}>追加</Button>
          </div>
        </div>
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="支払い方法を編集" size="sm">
        <div className="space-y-4">
          <Input label="名前" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>キャンセル</Button>
            <Button className="flex-1" onClick={async () => { if (!editTarget || !name.trim()) return; setSaving(true); await update(editTarget.id, { name: name.trim() }); setEditTarget(null); setName(""); setSaving(false); }} disabled={saving || !name.trim()}>保存</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function CategoriesSection() {
  const { categories, loading, create, update, remove } = useCategories();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; color: string } | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <CardTitle>カテゴリ</CardTitle>
        <Button size="sm" onClick={() => { setName(""); setColor(CATEGORY_COLORS[0]); setAddOpen(true); }}>
          <Plus size={14} aria-hidden="true" />追加
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-sm">カテゴリが登録されていません</div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                <span className="text-sm text-zinc-800">{cat.name}</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditTarget(cat); setName(cat.name); setColor(cat.color); }} aria-label={`${cat.name}を編集`}><Edit size={14} aria-hidden="true" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(cat.id)} aria-label={`${cat.name}を削除`} className="text-zinc-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} aria-hidden="true" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {[
        { open: addOpen, onClose: () => setAddOpen(false), title: "カテゴリを追加", onSave: async () => { if (!name.trim()) return; setSaving(true); await create({ name: name.trim(), color }); setName(""); setColor(CATEGORY_COLORS[0]); setAddOpen(false); setSaving(false); } },
        { open: !!editTarget, onClose: () => setEditTarget(null), title: "カテゴリを編集", onSave: async () => { if (!editTarget || !name.trim()) return; setSaving(true); await update(editTarget.id, { name: name.trim(), color }); setEditTarget(null); setSaving(false); } },
      ].map(({ open, onClose, title, onSave }) => (
        <Modal key={title} open={open} onClose={onClose} title={title} size="sm">
          <div className="space-y-4">
            <Input label="カテゴリ名" placeholder="例: 動画配信" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">カラー</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="カラー選択">
                {CATEGORY_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} aria-label={`カラー ${c}`} aria-pressed={color === c}
                    className="w-7 h-7 rounded-full transition-transform"
                    style={{ backgroundColor: c, outline: color === c ? "3px solid #111827" : "3px solid transparent", outlineOffset: "2px", transform: color === c ? "scale(1.15)" : "scale(1)" }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>キャンセル</Button>
              <Button className="flex-1" onClick={onSave} disabled={saving || !name.trim()}>保存</Button>
            </div>
          </div>
        </Modal>
      ))}
    </Card>
  );
}
