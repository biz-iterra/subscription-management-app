"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  useCategories,
  usePaymentMethods,
  useReminderSettings,
} from "@/hooks/useSettings";
import { CATEGORY_COLORS } from "@/lib/constants";
import { Edit, Plus, Trash2 } from "lucide-react";

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

// ==========================================
// リマインド設定
// ==========================================
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
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>リマインド設定</CardTitle>
      </CardHeader>
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">
              何日前に通知するか
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="30"
                value={currentDays}
                onChange={(e) => setDays(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-sm font-bold text-primary w-12 text-center">
                {currentDays}日前
              </span>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={currentEmail}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-ink">メール通知を受け取る</span>
          </label>

          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : saved ? "✓ 保存しました" : "保存"}
          </Button>
        </div>
      )}
    </Card>
  );
}

// ==========================================
// 支払い方法マスタ
// ==========================================
function PaymentMethodsSection() {
  const { paymentMethods, loading, create, update, remove } = usePaymentMethods();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await create({ name: name.trim() });
    setName("");
    setAddOpen(false);
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editTarget || !name.trim()) return;
    setSaving(true);
    await update(editTarget.id, { name: name.trim() });
    setEditTarget(null);
    setName("");
    setSaving(false);
  };

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <CardTitle>支払い方法</CardTitle>
        <Button size="sm" onClick={() => { setName(""); setAddOpen(true); }}>
          <Plus size={15} />
          追加
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="text-center py-8 text-ink-lighter text-sm">
          支払い方法が登録されていません
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {paymentMethods.map((pm) => (
            <li key={pm.id} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-ink">{pm.name}</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditTarget(pm); setName(pm.name); }}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(pm.id)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 追加モーダル */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="支払い方法を追加" size="sm">
        <div className="space-y-4">
          <Input
            label="名前"
            placeholder="例: クレジットカード"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>
              キャンセル
            </Button>
            <Button className="flex-1" onClick={handleCreate} disabled={saving || !name.trim()}>
              追加
            </Button>
          </div>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="支払い方法を編集" size="sm">
        <div className="space-y-4">
          <Input
            label="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>
              キャンセル
            </Button>
            <Button className="flex-1" onClick={handleUpdate} disabled={saving || !name.trim()}>
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

// ==========================================
// カテゴリマスタ
// ==========================================
function CategoriesSection() {
  const { categories, loading, create, update, remove } = useCategories();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; color: string } | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await create({ name: name.trim(), color });
    setName("");
    setColor(CATEGORY_COLORS[0]);
    setAddOpen(false);
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editTarget || !name.trim()) return;
    setSaving(true);
    await update(editTarget.id, { name: name.trim(), color });
    setEditTarget(null);
    setSaving(false);
  };

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <CardTitle>カテゴリ</CardTitle>
        <Button
          size="sm"
          onClick={() => { setName(""); setColor(CATEGORY_COLORS[0]); setAddOpen(true); }}
        >
          <Plus size={15} />
          追加
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 text-ink-lighter text-sm">
          カテゴリが登録されていません
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm text-ink">{cat.name}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditTarget(cat); setName(cat.name); setColor(cat.color); }}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(cat.id)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 追加/編集モーダル（共通） */}
      {[
        { open: addOpen, onClose: () => setAddOpen(false), title: "カテゴリを追加", onSave: handleCreate },
        { open: !!editTarget, onClose: () => setEditTarget(null), title: "カテゴリを編集", onSave: handleUpdate },
      ].map(({ open, onClose, title, onSave }) => (
        <Modal key={title} open={open} onClose={onClose} title={title} size="sm">
          <div className="space-y-4">
            <Input
              label="カテゴリ名"
              placeholder="例: 動画配信"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-ink">カラー</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? c : "transparent",
                      transform: color === c ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                キャンセル
              </Button>
              <Button className="flex-1" onClick={onSave} disabled={saving || !name.trim()}>
                保存
              </Button>
            </div>
          </div>
        </Modal>
      ))}
    </Card>
  );
}
