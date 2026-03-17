-- ==========================================
-- 002: RLS（Row Level Security）ポリシー設定
-- ==========================================

-- 全テーブルで RLS を有効化
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- profiles
-- ==========================================
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ==========================================
-- payment_methods
-- ==========================================
CREATE POLICY "payment_methods_all_own"
  ON public.payment_methods FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- categories
-- ==========================================
CREATE POLICY "categories_all_own"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- subscriptions
-- ==========================================
CREATE POLICY "subscriptions_all_own"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- payment_logs
-- ==========================================
CREATE POLICY "payment_logs_all_own"
  ON public.payment_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- reminder_settings
-- ==========================================
CREATE POLICY "reminder_settings_all_own"
  ON public.reminder_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
