# サブスクリプション管理アプリ

個人利用向けのサブスクリプションサービス管理Webアプリです。

---

## 概要

複数のサブスクリプションサービスを一元管理し、支払いリマインドや費用分析ができるアプリです。

---

## 技術スタック

| 用途 | 技術 | 費用 |
|------|------|------|
| フロントエンド | Next.js (App Router) + Tailwind CSS | $0 |
| ホスティング | Vercel | $0 |
| DB + 認証 + API | Supabase | $0 |
| メール通知 | Resend | $0 |
| 定期実行 | Supabase Edge Functions + pg_cron | $0 |
| グラフ | Recharts | $0 |
| **合計** | | **$0/月** |

---

## 機能一覧

### 認証
- Google OAuth によるログイン / ログアウト
- 未ログイン時は自動でログイン画面にリダイレクト
- ユーザーごとにデータが完全分離（RLS）

### サブスクリプション管理
- 登録項目
  - サービス名（必須）
  - 料金サイクル（週次 / 月次 / 四半期 / 年次）
  - 金額（必須）
  - 初回支払日（必須）
  - ステータス（利用中 / 停止中 / 解約済）
  - 支払い方法（マスタから選択）
  - カテゴリ（マスタから選択）
  - メモ（任意）
- 自動計算項目
  - 次回支払日
  - 次回支払いまでの日数
  - 利用開始からの経過期間

### 画面構成

| 画面 | パス | 内容 |
|------|------|------|
| ログイン | `/login` | Google ログインボタン |
| 一覧 | `/dashboard` | サブスク一覧・ソート・新規作成 |
| 詳細 | `/subscriptions/[id]` | 累計支払額・支払いログ |
| 新規作成 | `/subscriptions/new` | 登録フォーム |
| 編集 | `/subscriptions/[id]/edit` | 編集フォーム |
| 分析 | `/analytics` | 円グラフ（月間 / 年間タブ） |
| 支払い履歴 | `/history` | 月次棒グラフ（過去12ヶ月） |
| 設定 | `/settings` | マスタ管理・リマインド設定 |

### 通知
- メール通知のみ（プッシュ通知なし）
- Supabase Edge Functions が毎朝 09:00 JST に実行
- 支払い発生の N 日前にメールを送信（N は設定画面で変更可）

---

## セットアップ

### 必要条件

- Node.js 20 以上
- npm または pnpm
- Supabase アカウント
- Vercel アカウント
- Google Cloud Console アカウント
- Resend アカウント

### 1. リポジトリのクローンと依存インストール

```bash
git clone <repository-url>
cd subscription-management-app
pnpm install
```

### 2. 環境変数の設定

`.env.local` をプロジェクトルートに作成し、以下を設定してください。

```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
RESEND_API_KEY=re_[YOUR_RESEND_KEY]
```

`.env.example` に記載のサンプルも参照してください。

### 3. Supabase のセットアップ

#### DBマイグレーション実行

```bash
# Supabase CLI インストール（未インストールの場合）
pnpm add -g supabase

# マイグレーション適用
supabase db push
```

または Supabase ダッシュボードの SQL Editor で以下を順番に実行してください。

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_seed_master_data.sql`

#### Google OAuth の設定

1. [Google Cloud Console](https://console.cloud.google.com) で OAuth クライアント ID を作成
   - 承認済みのリダイレクト URI に以下を追加
     - `http://localhost:3000/api/auth/callback`（開発用）
     - `https://[PROJECT_REF].supabase.co/auth/v1/callback`（Supabase用）
     - `https://your-app.vercel.app/api/auth/callback`（本番用）
2. Supabase ダッシュボード → Authentication → Providers → Google を有効化
3. クライアント ID・シークレットを入力して保存

#### Edge Function のデプロイ

```bash
supabase functions deploy send-reminders
```

#### cron スケジュールの設定

Supabase ダッシュボードの SQL Editor で以下を実行してください。

```sql
SELECT cron.schedule(
  'send-daily-reminders',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/send-reminders',
    headers := '{"Authorization": "Bearer [ANON_KEY]", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### 4. ローカル開発サーバーの起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

---

## フォルダ構造

```
subscription-management-app/
├── .env.local                          # 環境変数（Git管理外）
├── .env.example                        # 環境変数サンプル
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── public/
│   └── favicon.ico
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql      # テーブル定義・トリガー
│   │   ├── 002_rls_policies.sql        # RLS ポリシー
│   │   └── 003_seed_master_data.sql    # 初期マスタデータ
│   └── functions/
│       └── send-reminders/
│           ├── index.ts                # リマインドメール送信 Edge Function
│           └── deno.json
│
└── src/
    ├── app/                            # Next.js App Router
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── (auth)/
    │   │   └── login/page.tsx          # ログイン画面
    │   ├── (app)/                      # 認証必須ルート
    │   │   ├── layout.tsx              # 共通レイアウト（Sidebar + Header）
    │   │   ├── dashboard/page.tsx      # 一覧画面
    │   │   ├── subscriptions/
    │   │   │   ├── new/page.tsx
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx        # 詳細画面
    │   │   │       └── edit/page.tsx
    │   │   ├── analytics/page.tsx      # 分析画面
    │   │   ├── history/page.tsx        # 支払い履歴画面
    │   │   └── settings/page.tsx       # 設定画面
    │   └── api/auth/callback/route.ts  # OAuth コールバック
    ├── components/
    │   ├── ui/                         # 汎用UIコンポーネント
    │   ├── layout/                     # Sidebar・Header
    │   ├── subscription/               # サブスク関連コンポーネント
    │   ├── charts/                     # グラフコンポーネント
    │   └── settings/                   # 設定関連コンポーネント
    ├── lib/
    │   ├── supabase/                   # Supabase クライアント
    │   ├── calculations.ts             # 次回支払日・累計額の計算ロジック
    │   ├── formatters.ts               # 通貨・日付フォーマット
    │   └── constants.ts                # 定数定義
    ├── hooks/                          # カスタムフック
    ├── types/
    │   └── index.ts                    # 全型定義
    └── middleware.ts                   # 認証ガード
```

---

## データベース設計

### テーブル一覧

| テーブル名 | 用途 |
|-----------|------|
| `profiles` | ユーザープロフィール（auth.users と1対1） |
| `payment_methods` | 支払い方法マスタ（ユーザーごと） |
| `categories` | カテゴリマスタ（ユーザーごと） |
| `subscriptions` | サブスクリプション本体 |
| `payment_logs` | 支払い履歴ログ |
| `reminder_settings` | リマインド設定（ユーザーごと） |

全テーブルに RLS（Row Level Security）を適用。`user_id = auth.uid()` により自分のデータのみ操作可能。

---

## デザイン

**Typographic / Editorial** ダークテーマ。Noto Sans JP フォント統一。WCAG AA アクセシビリティ準拠。

### カラーシステム

| 役割 | カラー | HEX | コントラスト比 |
|------|--------|-----|----------------|
| ページ背景 | ディープダーク | `#0D0D18` | — |
| カード/サーフェス | ダークサーフェス | `#141420` | — |
| 本文テキスト（第1） | ニアホワイト | `#EDEDFF` | ~17:1 ✓ |
| 本文テキスト（第2） | ミッドグレーブルー | `#9898BC` | ~6:1 ✓ |
| キャプション | ダークグレー | `#787898` | ~4.7:1 ✓ |
| プライマリ（ボタン・強調） | インディゴ | `#6366F1` | — |
| アクセント（利用中） | エメラルド | `#34D399` | ~9:1 ✓ |
| 警告（期限間近） | アンバー | `#FBBF24` | ~11:1 ✓ |

### デザイン手法

- **Typographic/Editorial**: タイポグラフィ階層が主役。大きな数字、明確な見出し、大文字ラベル
- **オペーク（不透明）サーフェス**: ブラー効果なし。信頼性の高いコントラスト
- **Tabular Numerals**: 金額・数値に等幅フォント (`font-variant-numeric: tabular-nums`)
- **アクセシビリティ**: 全テキストで WCAG AA（4.5:1 以上）準拠
- **ARIA**: `aria-label`, `aria-current`, `aria-pressed`, `role="dialog"` など適切に付与
- **フォント**: Noto Sans JP（Google Fonts）をサイト全体に適用

---

## 本番デプロイ

### Vercel へのデプロイ

```bash
# Vercel CLI でデプロイ
pnpm add -g vercel
vercel --prod
```

または GitHub リポジトリを Vercel と連携してプッシュ時に自動デプロイ。

Vercel ダッシュボードの **Settings → Environment Variables** に `.env.local` の内容を登録してください。

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-03-17 | 初版作成。技術スタック・機能要件・DB設計・フォルダ構造を確定 |
| 2026-03-17 | 会員管理（Google OAuth）を追加。Supabase Auth を採用 |
| 2026-03-17 | モバイルアプリを廃止しWebアプリのみに変更。APIサーバー（Hono/Railway）を廃止しSupabase直接接続に変更。月額$0構成に確定 |
| 2026-03-17 | 全フェーズの実装完了。Next.js プロジェクト・DB マイグレーション・全画面・Edge Function を実装 |
| 2026-03-17 | insert 時に user_id を明示的にセットするよう修正（RLS ポリシー違反を解消）。Supabase クライアントを useRef で固定し無限ループを防止 |
| 2026-03-17 | デザイン全面刷新：Glassmorphism + Isometric + Noto Sans JP + 60:30:10 配色ルール適用。全画面（ログイン・ダッシュボード・詳細・分析・履歴・設定）をダークテーマで統一。Recharts のツールチップ・グリッド・軸をダーク配色に更新 |
| 2026-03-17 | デザイン方針を Typographic/Editorial に刷新。Glassmorphism・Isometric・背景 Orb を廃止しオペークサーフェスへ移行。全テキストを WCAG AA（4.5:1 以上）準拠に修正。Tabular Numerals・大文字ラベル・エディトリアル数値表示を採用。aria-label 等のアクセシビリティ属性を追加 |
| 2026-03-17 | ダークテーマを廃止しライトテーマへ全面切り替え。白/ライトグレー基調のシンプルデザインに刷新。zinc カラースケール採用、ステータスバッジをセマンティックカラー（emerald/amber/zinc）に変更 |
| 2026-03-17 | 一覧画面の行全体クリックで詳細画面に遷移するよう修正（Stretchy Link パターン）。キーボードフォーカス時は行全体にリングを表示 |
| 2026-03-17 | 支払いログ自動生成を修正：初回支払日から今日まで billing_cycle に従い全ログを生成・保存。更新時は自動記録ログを削除して再生成（note="自動記録" で識別） |
| 2026-03-17 | 日付タイムゾーンズレ修正：toISOString() による UTC 変換を廃止し date-fns の format() に統一（JST+9 で1日ずれる問題を解消） |
| 2026-03-17 | 分析グラフのツールチップ修正：ホバー時にサービス名・カテゴリ名が表示されない問題を修正 |
