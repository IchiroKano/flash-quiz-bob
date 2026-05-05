# フラッシュクイズ - 昭和レトロの想い出

Datadogで情報システム全体をモニタリングする教材用のクイズアプリケーションです。

## 📋 概要

- **目的**: Datadogによる完全なオブザーバビリティの実装例
- **構成**: Docker 3コンテナ（Nginx、Node.js API、MySQL）
- **監視**: Infrastructure、APM、DBM、RUM、Logs
- **障害トレーニング**: 意図的なエラーを含む実践的な教材
- **デプロイ先**: ome.funnygeekjp.com/flashquiz_bob/

## ⚠️ セキュリティに関する重要な注意事項

### 機密情報の取り扱い

このリポジトリには**実際の機密情報は含まれていません**。すべてプレースホルダーです。

**含まれていないもの（デプロイ先で設定が必要）:**
- ❌ 実際のパスワード
- ❌ 実際のDatadog APIキー
- ❌ 実際のDatadog RUMトークン
- ❌ SSL証明書・秘密鍵
- ❌ 本番環境の.envファイル

**GitHub Public公開可能:**
このリポジトリはGitHub Publicに安全に公開できます。実際の機密情報は`.gitignore`で除外されており、デプロイ先サーバーで環境変数として設定します。

**デプロイ時の注意:**
1. `.env.example`を参考に、デプロイ先で環境変数を設定してください
2. 実際のパスワードやAPIキーは、このリポジトリにコミットしないでください
3. SSL証明書は、デプロイ先で別途設定してください

詳細は [`docs/deploy-guide.md`](docs/deploy-guide.md) を参照してください。

---

## 🎯 デプロイ情報

### コンテナ名
- **Web**: flash-quiz-bob-web
- **API**: flash-quiz-bob-api
- **DB**: flash-quiz-bob-db

### ネットワーク
- **ネットワーク名**: ome_flashquiz_bob

### ポート設定
- **コンテナ内Nginx**: 80
- **ホストポート**: 8083 → ホストNginxがリバースプロキシ

### ベースパス
- **アプリケーション**: /flashquiz_bob/
- **API**: /flashquiz_bob/api/

### Datadog設定
- **RUM**: ホストNginxが自動注入（コンテナ内では設定不要）
- **APMサービス名**: flash-quiz-bob-api
- **DBMサービス名**: flash-quiz-bob-db
- **RUMサービス名**: flash-quiz-bob-rum（ホスト側で設定）

### データ永続化
- **MySQL**: ./data/mysql/
- **Nginxログ**: ./data/nginx/logs/

## 🏗️ アーキテクチャ

```
┌─────────────────────┐
│   Browser           │
│  (RUM監視)          │
└──────┬──────────────┘
       │ HTTPS:443
┌──────▼──────────────┐
│  ホストNginx         │
│  (RUM自動注入)      │
│  /flashquiz_bob/    │
└──────┬──────────────┘
       │ HTTP:8083
┌──────▼──────────────┐
│  コンテナNginx       │
│  flash-quiz-bob-web │
│  静的ファイル配信    │
└──────┬──────────────┘
       │ HTTP:3012
┌──────▼──────────────┐
│  Node.js API        │
│  flash-quiz-bob-api │
│  Express + APM      │
└──────┬──────────────┘
       │ MySQL:3306
┌──────▼──────────────┐
│  MySQL (DBM)        │
│  flash-quiz-bob-db  │
│  クイズデータ        │
└─────────────────────┘
```

## 🚀 クイックスタート

### 前提条件

- Docker & Docker Compose
- Git
- Datadog アカウント（オプション）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd flash-quiz
```

### 2. 環境変数の設定

デプロイ先サーバーで環境変数を設定してください（.envファイルは使用しません）。

必須の環境変数：
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `NODE_ENV`
- `API_PORT`
- `DD_SERVICE`（各コンテナで設定）
- `DD_ENV`
- `DD_VERSION`
- `DD_AGENT_HOST`
- `DD_TRACE_AGENT_PORT`
- `DD_LOGS_INJECTION`
- `DD_TRACE_SAMPLE_RATE`

### 3. データディレクトリの作成

```bash
mkdir -p ./data/mysql
mkdir -p ./data/nginx/logs
```

### 4. コンテナのビルドと起動

```bash
docker-compose up -d --build
```

### 5. アプリケーションへのアクセス

- **本番**: https://ome.funnygeekjp.com/flashquiz_bob/
- **ローカル**: http://localhost:8083/flashquiz_bob/

### 6. 動作確認

```bash
# ヘルスチェック
curl http://localhost:8083/health

# ログ確認
docker-compose logs -f

# コンテナ状態確認
docker ps | grep flash-quiz-bob
```

## 📁 プロジェクト構造

```
flash-quiz/
├── docker-compose.yml          # Docker Compose設定
├── .env.example                # 環境変数サンプル
├── README.md                   # このファイル
├── docs/                       # ドキュメント
│   ├── 01要件定義.md
│   ├── 02基本設計.md
│   ├── datadog-setup.md
│   └── deploy-guide.md         # デプロイガイド
├── scripts/                    # スクリプト
│   └── deploy.sh               # デプロイスクリプト
├── nginx/                      # Nginxコンテナ
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ssl/
├── frontend/                   # フロントエンド
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── quiz.js
│       └── confetti.js
├── api/                        # APIサーバー
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── config/
│       ├── routes/
│       ├── models/
│       ├── middleware/
│       └── utils/
└── mysql/                      # MySQLコンテナ
    ├── Dockerfile
    ├── conf.d/
    └── init/
        ├── 01-schema.sql
        ├── 02-categories.sql
        ├── 03-quizzes-part1.sql
        ├── 04-quiz-options-part1.sql
        └── 05-quiz-options-part2.sql
```

## 🔧 開発

### ローカル開発環境

```bash
# APIサーバーのみ起動（開発モード）
cd api
npm install
npm run dev

# ログのリアルタイム表示
docker-compose logs -f api

# 特定のコンテナを再起動
docker-compose restart api
```

### データベース接続

```bash
# MySQLコンテナに接続
docker-compose exec mysql mysql -u quiz_user -p flash_quiz

# データベースのバックアップ
docker-compose exec mysql mysqldump -u root -p flash_quiz > backup.sql
```

## 🚀 デプロイ

### GitHubプライベートリポジトリ経由でのデプロイ

本番環境へのデプロイは、GitHubプライベートリポジトリを経由して行います。

#### クイックデプロイ

```bash
# サーバーにSSH接続
ssh username@your-server-ip

# デプロイスクリプトを実行
cd /opt/flash-quiz
./scripts/deploy.sh
```

デプロイスクリプトは以下を自動実行します：
- ✅ Gitから最新のコードを取得
- ✅ データベースの自動バックアップ
- ✅ Dockerイメージのビルド
- ✅ コンテナの再起動
- ✅ ヘルスチェック
- ✅ エラーハンドリングとロールバック機能

#### 詳細なデプロイ手順

初回デプロイや詳細な手順については、以下のドキュメントを参照してください：

📖 **[デプロイガイド](docs/deploy-guide.md)**

デプロイガイドには以下の内容が含まれています：
- GitHubプライベートリポジトリの作成手順
- ローカルからGitHubへのpush手順
- Ubuntuサーバーの準備（Git、Docker、docker-compose）
- SSH鍵の設定（GitHubアクセス用）
- サーバーでのclone/pull手順
- 環境変数の設定
- docker-compose up -d --build の実行
- 動作確認方法
- トラブルシューティング

#### 手動デプロイ

デプロイスクリプトを使用せずに手動でデプロイする場合：

```bash
# 最新のコードを取得
git pull origin main

# コンテナの再ビルドと再起動
docker compose down
docker compose up -d --build

# ログで確認
docker compose logs -f
```

#### ロールバック

問題が発生した場合、前のバージョンに戻すことができます：

```bash
# コミット履歴を確認
git log --oneline -10

# 特定のコミットに戻す
git checkout <commit-hash>

# コンテナの再ビルド
docker compose up -d --build
```

## 📊 Datadog監視設定

### 重要な注意事項

- **RUM設定**: コンテナ内では設定不要。ホストNginxが自動的にDatadog RUMスクリプトを注入します。
- **サービス名**: 各コンテナで固定のサービス名を使用（環境変数で上書き可能）
  - API: `flash-quiz-bob-api`
  - DB: `flash-quiz-bob-db`
  - RUM: `flash-quiz-bob-rum`（ホスト側）

詳細は [docs/datadog-setup.md](docs/datadog-setup.md) を参照してください。

### 監視項目

1. **Infrastructure Monitoring**
   - コンテナメトリクス（CPU、メモリ、ネットワーク）
   - ディスク使用率
   - コンテナステータス

2. **APM (Application Performance Monitoring)**
   - APIエンドポイントのトレース
   - データベースクエリ
   - レスポンスタイム（p50, p95, p99）
   - エラーレート

3. **DBM (Database Monitoring)**
   - スロークエリ検出
   - クエリ実行回数
   - コネクション数

4. **RUM (Real User Monitoring)**
   - ページロード時間
   - JavaScriptエラー
   - ユーザーセッション
   - カスタムアクション

5. **Logs**
   - Nginxアクセスログ/エラーログ
   - APIアプリケーションログ
   - MySQLスロークエリログ

## 🎯 障害トレーニング機能

このアプリケーションには、意図的に以下の障害が組み込まれています：

### 1. DBデータ不整合（5%）
- **現象**: クイズ100問中5問で正解データがNULL
- **エラー**: 「クイズデータに不整合があります」
- **検出方法**: Datadog APMでエラートレース確認

### 2. API応答遅延（5%）
- **現象**: 5%の確率で2秒以上の遅延
- **影響**: タイムアウトにはならないが、ユーザー体験が悪化
- **検出方法**: Datadog APMでp95/p99レスポンスタイム監視

### 3. ニックネームバリデーションエラー
- **現象**: 8文字未満のニックネームでエラー
- **エラー**: 「入力エラーが発生しました」（具体的な条件は非表示）
- **検出方法**: Datadog RUMでエラー発生率確認

## 🛠️ トラブルシューティング

### コンテナが起動しない

```bash
# ログ確認
docker-compose logs

# コンテナの状態確認
docker-compose ps

# 完全にクリーンアップして再起動
docker-compose down -v
docker-compose up -d --build
```

### データベース接続エラー

```bash
# MySQLコンテナのヘルスチェック
docker-compose exec mysql mysqladmin ping -h localhost -u root -p

# 初期化スクリプトの再実行
docker-compose down -v
docker-compose up -d
```

### ポート競合

ポート8083が既に使用されている場合は、docker-compose.ymlのポート設定を変更してください。

```yaml
ports:
  - "8084:80"  # 別のポートに変更
```

### データ永続化の確認

```bash
# MySQLデータの確認
ls -la ./data/mysql/

# Nginxログの確認
ls -la ./data/nginx/logs/
```

## 📝 API仕様

### エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/categories | カテゴリ一覧取得 |
| GET | /api/quizzes/:categoryId | クイズ10問取得 |
| POST | /api/scores | 成績登録 |
| GET | /api/rankings/:categoryId | ランキング取得 |
| GET | /api/health | ヘルスチェック |

詳細は [docs/02基本設計.md](docs/02基本設計.md) を参照してください。

## 🔒 セキュリティ

- HTTPS通信（TLS 1.2以上）
- SQLインジェクション対策（プリペアドステートメント）
- XSS対策（入力値サニタイズ）
- CORS設定
- レート制限（DDoS対策）
- セキュリティヘッダー設定

## 📄 ライセンス

MIT License

## 👥 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 📞 サポート

問題が発生した場合は、GitHubのissueを作成してください。