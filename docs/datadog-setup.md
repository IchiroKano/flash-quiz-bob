# Datadog監視設定ガイド

このドキュメントでは、フラッシュクイズアプリケーションにDatadog監視を設定する手順を説明します。

## 📋 目次

1. [前提条件](#前提条件)
2. [Datadog Agentのインストール](#datadog-agentのインストール)
3. [APM設定](#apm設定)
4. [DBM設定](#dbm設定)
5. [RUM設定](#rum設定)
6. [ログ収集設定](#ログ収集設定)
7. [ダッシュボード作成](#ダッシュボード作成)
8. [アラート設定](#アラート設定)

## 前提条件

- Datadogアカウント（無料トライアルまたは有料プラン）
- Datadog API Key
- 管理者権限

## Datadog Agentのインストール

### 1. Datadog Agentコンテナの追加

`docker-compose.yml`にDatadog Agentを追加します：

```yaml
services:
  datadog-agent:
    image: gcr.io/datadoghq/agent:7
    container_name: datadog-agent
    environment:
      - DD_API_KEY=${DD_API_KEY}
      - DD_SITE=${DD_SITE:-datadoghq.com}
      - DD_HOSTNAME=flash-quiz-host
      - DD_TAGS=env:production service:flash-quiz
      # APM有効化
      - DD_APM_ENABLED=true
      - DD_APM_NON_LOCAL_TRAFFIC=true
      # ログ収集有効化
      - DD_LOGS_ENABLED=true
      - DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true
      # プロセス監視有効化
      - DD_PROCESS_AGENT_ENABLED=true
      # コンテナ監視有効化
      - DD_CONTAINER_EXCLUDE="name:datadog-agent"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc/:ro
      - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    networks:
      - quiz_network
    restart: unless-stopped
```

### 2. 環境変数の設定

`.env`ファイルにDatadog API Keyを追加：

```bash
DD_API_KEY=your_actual_datadog_api_key
DD_SITE=datadoghq.com  # US1リージョンの場合
```

### 3. コンテナの再起動

```bash
docker-compose up -d datadog-agent
```

## APM設定

### 1. Node.js APIのAPM設定

すでに実装済み（`api/src/config/datadog.js`）。以下の設定が有効です：

- サービス名: `flash-quiz-api`
- 環境: `production`
- サンプリングレート: 100%
- ランタイムメトリクス: 有効
- プロファイリング: 有効

### 2. APMダッシュボードの確認

1. Datadogにログイン
2. **APM > Services**に移動
3. `flash-quiz-api`サービスを確認

### 3. 確認すべきメトリクス

- **Requests per second**: リクエスト数
- **Latency (p50, p95, p99)**: レスポンスタイム
- **Error rate**: エラー率
- **Apdex score**: ユーザー満足度

### 4. トレースの確認

1. **APM > Traces**に移動
2. サービス: `flash-quiz-api`でフィルタ
3. 個別のトレースを確認：
   - `/api/quizzes/:categoryId` - クイズ取得
   - `/api/scores` - スコア登録
   - データベースクエリの詳細

## DBM設定

### 1. MySQL統合の有効化

Datadog Agentの設定に追加：

```yaml
datadog-agent:
  environment:
    # DBM有効化
    - DD_DBM_ENABLED=true
  volumes:
    # MySQL統合設定
    - ./datadog/conf.d/mysql.d:/etc/datadog-agent/conf.d/mysql.d:ro
```

### 2. MySQL統合設定ファイル

`datadog/conf.d/mysql.d/conf.yaml`を作成：

```yaml
init_config:

instances:
  - host: mysql
    port: 3306
    username: datadog
    password: datadog_password
    dbm: true
    tags:
      - env:production
      - service:flash-quiz
    options:
      replication: false
      galera_cluster: false
```

### 3. Datadog用MySQLユーザーの作成

MySQLコンテナで実行：

```sql
CREATE USER 'datadog'@'%' IDENTIFIED BY 'datadog_password';
GRANT REPLICATION CLIENT ON *.* TO 'datadog'@'%';
GRANT PROCESS ON *.* TO 'datadog'@'%';
GRANT SELECT ON performance_schema.* TO 'datadog'@'%';
FLUSH PRIVILEGES;
```

### 4. DBMダッシュボードの確認

1. **Database Monitoring**に移動
2. `flash_quiz`データベースを選択
3. 確認項目：
   - スロークエリ
   - クエリ実行回数
   - 待機イベント
   - コネクション数

## RUM設定

### 1. RUMアプリケーションの作成

1. Datadogで**RUM > Applications**に移動
2. **New Application**をクリック
3. アプリケーション名: `flash-quiz-frontend`
4. アプリケーションタイプ: `Browser`
5. **Application ID**と**Client Token**をコピー

### 2. 環境変数の設定

`.env`ファイルに追加：

```bash
DD_RUM_APPLICATION_ID=your_rum_application_id
DD_RUM_CLIENT_TOKEN=your_rum_client_token
```

### 3. フロントエンドの設定

すでに実装済み（`frontend/index.html`）。以下が自動的に収集されます：

- ページビュー
- ユーザーアクション（クリック、入力）
- JavaScriptエラー
- リソース読み込み時間
- カスタムアクション（クイズ完了など）

### 4. RUMダッシュボードの確認

1. **RUM > Applications**に移動
2. `flash-quiz-frontend`を選択
3. 確認項目：
   - ページロード時間
   - Core Web Vitals（LCP、FID、CLS）
   - エラー率
   - ユーザーセッション

## ログ収集設定

### 1. ログラベルの追加

`docker-compose.yml`の各サービスにラベルを追加：

```yaml
services:
  nginx:
    labels:
      com.datadoghq.ad.logs: '[{"source": "nginx", "service": "flash-quiz-nginx"}]'
  
  api:
    labels:
      com.datadoghq.ad.logs: '[{"source": "nodejs", "service": "flash-quiz-api"}]'
  
  mysql:
    labels:
      com.datadoghq.ad.logs: '[{"source": "mysql", "service": "flash-quiz-mysql"}]'
```

### 2. ログの確認

1. **Logs > Search**に移動
2. サービスでフィルタ：
   - `service:flash-quiz-nginx`
   - `service:flash-quiz-api`
   - `service:flash-quiz-mysql`

### 3. ログパターンの作成

よく見るログパターンを保存：

```
# APIエラーログ
service:flash-quiz-api status:error

# スロークエリ
service:flash-quiz-mysql @query_time:>1

# 4xxエラー
service:flash-quiz-nginx @http.status_code:[400 TO 499]
```

## ダッシュボード作成

### 1. カスタムダッシュボードの作成

1. **Dashboards > New Dashboard**
2. 名前: `Flash Quiz - Overview`

### 2. 推奨ウィジェット

#### インフラストラクチャ
- コンテナCPU使用率
- コンテナメモリ使用率
- ディスク使用率

#### APM
- リクエスト数（Timeseries）
- レスポンスタイム（p50, p95, p99）
- エラー率
- トップエンドポイント（Top List）

#### DBM
- スロークエリ数
- クエリ実行回数
- アクティブコネクション数

#### RUM
- ページビュー数
- ページロード時間
- JavaScriptエラー数
- ユーザーセッション数

#### ビジネスメトリクス
- クイズ完了数
- 平均正解率
- ランキング登録数

### 3. ダッシュボードのエクスポート

```bash
# ダッシュボードをJSON形式でエクスポート
# Datadog UI > Dashboard > Settings > Export Dashboard JSON
```

## アラート設定

### 1. APMアラート

#### 高エラー率アラート

```yaml
名前: [Flash Quiz] High Error Rate
メトリクス: trace.express.request.errors
条件: sum:trace.express.request.errors{service:flash-quiz-api}.as_rate() > 0.05
評価期間: 5分間
通知: Slack, Email
```

#### 高レスポンスタイムアラート

```yaml
名前: [Flash Quiz] High Response Time
メトリクス: trace.express.request.duration.by.service.95p
条件: avg:trace.express.request.duration.by.service.95p{service:flash-quiz-api} > 1000
評価期間: 5分間
通知: Slack, Email
```

### 2. インフラアラート

#### コンテナダウンアラート

```yaml
名前: [Flash Quiz] Container Down
メトリクス: docker.containers.running
条件: avg:docker.containers.running{image_name:flash-quiz-*} < 1
評価期間: 2分間
通知: PagerDuty, Slack
```

#### 高CPU使用率アラート

```yaml
名前: [Flash Quiz] High CPU Usage
メトリクス: docker.cpu.usage
条件: avg:docker.cpu.usage{container_name:flash-quiz-*} > 80
評価期間: 10分間
通知: Slack
```

### 3. DBMアラート

#### スロークエリアラート

```yaml
名前: [Flash Quiz] Slow Queries Detected
メトリクス: mysql.queries.slow
条件: sum:mysql.queries.slow{service:flash-quiz-mysql} > 10
評価期間: 5分間
通知: Slack
```

### 4. RUMアラート

#### 高JavaScriptエラー率

```yaml
名前: [Flash Quiz] High JS Error Rate
メトリクス: rum.error_count
条件: sum:rum.error_count{application_id:flash-quiz-frontend}.as_rate() > 0.1
評価期間: 10分間
通知: Slack
```

### 5. 合成監視（Synthetic Monitoring）

#### URLチェック

```yaml
名前: Flash Quiz - HTTPS Check
URL: https://your-domain.com
頻度: 1分ごと
ロケーション: 複数リージョン
アラート条件: 3回連続失敗
```

## モニタリングのベストプラクティス

### 1. タグ戦略

すべてのリソースに一貫したタグを付ける：

```
env:production
service:flash-quiz
component:api|frontend|database
version:1.0.0
```

### 2. SLO（Service Level Objectives）の設定

```yaml
可用性SLO: 99.9%（月間）
レスポンスタイムSLO: p95 < 500ms
エラー率SLO: < 1%
```

### 3. 定期的なレビュー

- 週次: ダッシュボードレビュー
- 月次: SLOレビュー、アラート調整
- 四半期: 監視戦略の見直し

## トラブルシューティング

### Agentが起動しない

```bash
# Agentログ確認
docker-compose logs datadog-agent

# API Key確認
docker-compose exec datadog-agent agent status
```

### APMトレースが表示されない

1. API Keyが正しいか確認
2. Agentが起動しているか確認
3. ネットワーク接続を確認
4. `DD_TRACE_DEBUG=true`で詳細ログを確認

### RUMデータが表示されない

1. Application IDとClient Tokenが正しいか確認
2. ブラウザのコンソールでエラーを確認
3. Content Security Policyの設定を確認

## 参考リンク

- [Datadog APM Documentation](https://docs.datadoghq.com/tracing/)
- [Datadog DBM Documentation](https://docs.datadoghq.com/database_monitoring/)
- [Datadog RUM Documentation](https://docs.datadoghq.com/real_user_monitoring/)
- [Datadog Agent Documentation](https://docs.datadoghq.com/agent/)