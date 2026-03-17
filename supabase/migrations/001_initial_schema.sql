-- ==========================================
-- 001: 初期スキーマ定義
-- ==========================================

-- profiles テーブル（auth.users と 1:1）
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- payment_methods テーブル（支払い方法マスタ）
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, name)
);

-- categories テーブル（カテゴリマスタ）
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6B7280',
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, name)
);

-- subscriptions テーブル（メインテーブル）
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id         UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  payment_method_id   UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  service_name        TEXT NOT NULL,
  billing_cycle       TEXT NOT NULL CHECK (billing_cycle IN ('weekly','monthly','quarterly','yearly')),
  amount              NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency            TEXT NOT NULL DEFAULT 'JPY',
  first_payment_date  DATE NOT NULL,
  memo                TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','paused','cancelled')),
  created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- payment_logs テーブル（支払い履歴）
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_date     DATE NOT NULL,
  amount           NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency         TEXT NOT NULL DEFAULT 'JPY',
  note             TEXT,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- reminder_settings テーブル（ユーザーごとのリマインド設定）
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  days_before     INT NOT NULL DEFAULT 3 CHECK (days_before >= 1 AND days_before <= 30),
  email_enabled   BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- インデックス
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id     ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status      ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_subscription ON public.payment_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_date    ON public.payment_logs(user_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id   ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id        ON public.categories(user_id);

-- ==========================================
-- updated_at 自動更新トリガー
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER reminder_settings_updated_at
  BEFORE UPDATE ON public.reminder_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==========================================
-- 新規ユーザー登録時の自動処理トリガー
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- プロフィール自動生成
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- リマインド設定（デフォルト値）自動生成
  INSERT INTO public.reminder_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
