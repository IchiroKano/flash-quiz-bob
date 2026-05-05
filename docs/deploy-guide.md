# デプロイガイド - GitHubプライベートリポジトリ経由

このガイドでは、GitHubプライベートリポジトリを使用してUbuntuサーバーにフラッシュクイズアプリケーションをデプロイする手順を説明します。

## 📋 目次

1. [前提条件](#前提条件)
2. [GitHubプライベートリポジトリの準備](#gitHubプライベートリポジトリの準備)
3. [ローカル環境からのPush](#ローカル環境からのpush)
4. [Ubuntuサーバーの準備](#ubuntuサーバーの準備)
5. [SSH鍵の設定](#ssh鍵の設定)
6. [アプリケーションのデプロイ](#アプリケーションのデプロイ)
7. [環境変数の設定](#環境変数の設定)
8. [動作確認](#動作確認)
9. [トラブルシューティング](#トラブルシューティング)
10. [更新手順](#更新手順)

---

## 前提条件

### ローカル環境
- Git がインストールされていること
- GitHubアカウントを持っていること
- プロジェクトのソースコードがローカルにあること

### サーバー環境
- Ubuntu 24.04.2 LTS (Noble Numbat)
- root権限またはsudo権限を持つユーザー
- インターネット接続
- 最低スペック: 4GB RAM, 600GB ディスク空き容量

---

## GitHubプライベートリポジトリの準備

### 1. GitHubでプライベートリポジトリを作成

1. GitHubにログイン: https://github.com/IchiroKano
2. 右上の「+」→「New repository」をクリック
3. リポジトリ情報を入力:
   - **Repository name**: `flash-quiz-bob`（任意の名前）
   - **Description**: `フラッシュクイズ - 昭和レトロの想い出`
   - **Visibility**: 🔒 **Private** を選択
   - **Initialize this repository with**: チェックを入れない
4. 「Create repository」をクリック

### 2. リポジトリURLの確認

作成後、以下のようなURLが表示されます：
```
git@github.com:your-username/flash-quiz-app.git
```

このURLを後で使用するのでメモしておきます。

---

## ローカル環境からのPush

### 1. Gitリポジトリの初期化（まだの場合）

```bash
cd /path/to/flash-quiz
git init
```

### 2. .gitignoreの確認

以下のファイルが除外されていることを確認：

```bash
cat .gitignore
```

内容例：
```
# 環境変数
.env

# データディレクトリ
data/

# Node modules
node_modules/
api/node_modules/

# ログファイル
*.log
logs/

# OS固有
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

### 3. リモートリポジトリの追加

```bash
git remote add origin git@github.com:your-username/flash-quiz-app.git
```

既にリモートが設定されている場合は変更：
```bash
git remote set-url origin git@github.com:your-username/flash-quiz-app.git
```

### 4. 初回コミットとPush

```bash
# 全ファイルをステージング
git add .

# コミット
git commit -m "Initial commit: Flash Quiz Application"

# メインブランチの確認・変更
git branch -M main

# プッシュ
git push -u origin main
```

### 5. プッシュの確認

GitHubのリポジトリページでファイルがアップロードされていることを確認します。

---

## Ubuntuサーバーの準備

### 1. サーバーへのSSH接続

```bash
ssh username@your-server-ip
```

### 2. システムのアップデート

```bash
sudo apt update
sudo apt upgrade -y
```

### 3. 必要なパッケージのインストール

#### Git のインストール

```bash
sudo apt install git -y
git --version
```

#### Docker のインストール

```bash
# 古いバージョンの削除
sudo apt remove docker docker-engine docker.io containerd runc

# 依存パッケージのインストール
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Docker公式GPGキーの追加
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Dockerリポジトリの追加
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Dockerのインストール
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Dockerの起動と自動起動設定
sudo systemctl start docker
sudo systemctl enable docker

# バージョン確認
docker --version
docker compose version
```

#### 現在のユーザーをdockerグループに追加

```bash
sudo usermod -aG docker $USER

# 変更を反映（再ログインまたは以下を実行）
newgrp docker

# 確認
docker ps
```

### 4. デプロイ用ディレクトリの作成

```bash
sudo mkdir -p /opt/flash-quiz
sudo chown $USER:$USER /opt/flash-quiz
cd /opt/flash-quiz
```

---

## SSH鍵の設定

GitHubプライベートリポジトリにアクセスするため、サーバーにSSH鍵を設定します。

### 1. SSH鍵の生成

```bash
# SSH鍵を生成（パスフレーズは任意）
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/github_deploy

# 鍵が生成されたことを確認
ls -la ~/.ssh/github_deploy*
```

出力例：
```
-rw------- 1 user user  464 May  5 10:00 /home/user/.ssh/github_deploy
-rw-r--r-- 1 user user  103 May  5 10:00 /home/user/.ssh/github_deploy.pub
```

### 2. 公開鍵の内容を表示

```bash
cat ~/.ssh/github_deploy.pub
```

出力された公開鍵をコピーします（`ssh-ed25519 AAAA...` で始まる行全体）。

### 3. GitHubにデプロイキーを追加

1. GitHubのリポジトリページにアクセス
2. 「Settings」→「Deploy keys」をクリック
3. 「Add deploy key」をクリック
4. 以下を入力：
   - **Title**: `Production Server Deploy Key`
   - **Key**: コピーした公開鍵を貼り付け
   - **Allow write access**: チェックを入れない（読み取り専用）
5. 「Add key」をクリック

### 4. SSH設定ファイルの作成

```bash
cat > ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy
    IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config
```

### 5. GitHub接続テスト

```bash
ssh -T git@github.com
```

成功すると以下のようなメッセージが表示されます：
```
Hi your-username! You've successfully authenticated, but GitHub does not provide shell access.
```

---

## アプリケーションのデプロイ

### 1. リポジトリのクローン

```bash
cd /opt/flash-quiz
git clone git@github.com:your-username/flash-quiz-app.git .
```

**注意**: 最後の `.` は現在のディレクトリにクローンすることを意味します。

### 2. ファイル構造の確認

```bash
ls -la
```

以下のようなファイル・ディレクトリが表示されるはずです：
```
drwxr-xr-x  api/
drwxr-xr-x  docs/
drwxr-xr-x  frontend/
drwxr-xr-x  mysql/
drwxr-xr-x  nginx/
-rw-r--r--  docker-compose.yml
-rw-r--r--  .env.example
-rw-r--r--  README.md
```

### 3. データディレクトリの作成

```bash
mkdir -p ./data/mysql
mkdir -p ./data/nginx/logs

# パーミッションの設定
chmod 755 ./data
chmod 755 ./data/mysql
chmod 755 ./data/nginx
chmod 755 ./data/nginx/logs
```

---

## 環境変数の設定

### 1. 環境変数ファイルの作成

```bash
cp .env.example .env
nano .env
```

### 2. 環境変数の編集

以下の値を実際の環境に合わせて変更します：

```bash
# MySQL設定
MYSQL_ROOT_PASSWORD=your_secure_root_password_here
MYSQL_DATABASE=flash_quiz
MYSQL_USER=quiz_user
MYSQL_PASSWORD=your_secure_password_here

# Node.js API設定
NODE_ENV=production
API_PORT=3012

# Datadog APM設定
DD_SERVICE=flash-quiz-bob-api
DD_ENV=production
DD_VERSION=1.0.0
DD_AGENT_HOST=172.17.0.1
DD_TRACE_AGENT_PORT=8126
DD_LOGS_INJECTION=true
DD_TRACE_SAMPLE_RATE=1.0
DD_API_KEY=your_actual_datadog_api_key
DD_SITE=datadoghq.com

# Datadog RUM設定（フロントエンド）
DD_RUM_APPLICATION_ID=your_actual_rum_application_id
DD_RUM_CLIENT_TOKEN=your_actual_rum_client_token
```

**重要な設定項目**:

- `MYSQL_ROOT_PASSWORD`: 強力なパスワードを設定（20文字以上推奨）
- `MYSQL_PASSWORD`: 強力なパスワードを設定（20文字以上推奨）
- `DD_AGENT_HOST`: Datadogエージェントのホスト（通常は`172.17.0.1`）
- `DD_API_KEY`: Datadogのダッシュボードから取得
- `DD_RUM_APPLICATION_ID`: Datadog RUMアプリケーションIDを設定
- `DD_RUM_CLIENT_TOKEN`: Datadog RUMクライアントトークンを設定

### 3. ファイルのパーミッション設定

```bash
chmod 600 .env
```

### 4. 環境変数の確認

```bash
cat .env | grep -v "PASSWORD\|KEY\|TOKEN"
```

パスワードやキーを除いた設定が表示されます。

---

## アプリケーションの起動

### 1. Dockerイメージのビルドとコンテナの起動

```bash
cd /opt/flash-quiz
docker compose up -d --build
```

このコマンドは以下を実行します：
- Dockerイメージのビルド（初回は5-10分程度）
- コンテナの起動
- バックグラウンドで実行（`-d`オプション）

### 2. ビルドとデプロイの進行状況確認

```bash
# リアルタイムでログを表示
docker compose logs -f

# 特定のコンテナのログのみ表示
docker compose logs -f api
docker compose logs -f mysql
docker compose logs -f nginx
```

ログを停止するには `Ctrl+C` を押します。

### 3. コンテナの状態確認

```bash
docker compose ps
```

すべてのコンテナが `Up` 状態であることを確認します：

```
NAME                    STATUS              PORTS
flash-quiz-bob-api      Up (healthy)        
flash-quiz-bob-db       Up (healthy)        
flash-quiz-bob-web      Up (healthy)        0.0.0.0:8083->80/tcp
```

---

## 動作確認

### 1. ヘルスチェック

```bash
# Nginxのヘルスチェック
curl http://localhost:8083/health

# APIのヘルスチェック
curl http://localhost:8083/api/health
```

成功すると以下のようなレスポンスが返ります：
```json
{"status":"ok","timestamp":"2026-05-05T07:50:00.000Z"}
```

### 2. カテゴリ一覧の取得

```bash
curl http://localhost:8083/api/categories
```

カテゴリのリストが返ることを確認します。

### 3. データベース接続確認

```bash
docker compose exec mysql mysql -u quiz_user -p flash_quiz
```

パスワードを入力してMySQLに接続できることを確認します。

接続後、以下のコマンドでデータを確認：
```sql
SHOW TABLES;
SELECT COUNT(*) FROM quizzes;
SELECT COUNT(*) FROM categories;
EXIT;
```

### 4. ブラウザでの動作確認

サーバーのIPアドレスまたはドメインでアクセス：

- **ローカルテスト**: http://localhost:8083/flashquiz_bob/
- **本番環境**: https://your-domain.com/flashquiz_bob/

以下を確認：
- ✅ ページが正常に表示される
- ✅ カテゴリが表示される
- ✅ クイズが開始できる
- ✅ 回答が送信できる
- ✅ ランキングが表示される

### 5. Datadog監視の確認

Datadogダッシュボードで以下を確認：

1. **Infrastructure**: コンテナが表示されている
2. **APM**: トレースが記録されている
3. **DBM**: データベースクエリが監視されている
4. **RUM**: ユーザーセッションが記録されている
5. **Logs**: ログが収集されている

---

## トラブルシューティング

### コンテナが起動しない

#### 症状
```bash
docker compose ps
```
で一部のコンテナが `Exited` 状態

#### 解決方法

1. **ログを確認**
```bash
docker compose logs mysql
docker compose logs api
docker compose logs nginx
```

2. **環境変数を確認**
```bash
docker compose config
```

3. **完全にクリーンアップして再起動**
```bash
docker compose down -v
docker compose up -d --build
```

### データベース接続エラー

#### 症状
APIログに `ECONNREFUSED` や `Access denied` エラー

#### 解決方法

1. **MySQLコンテナの状態確認**
```bash
docker compose ps mysql
docker compose logs mysql
```

2. **MySQLのヘルスチェック**
```bash
docker compose exec mysql mysqladmin ping -h localhost -u root -p
```

3. **環境変数の確認**
```bash
# .envファイルの確認
cat .env | grep MYSQL

# コンテナ内の環境変数確認
docker compose exec api env | grep DB_
```

4. **データベースの再初期化**
```bash
docker compose down -v
rm -rf ./data/mysql/*
docker compose up -d
```

### ポート競合エラー

#### 症状
```
Error: bind: address already in use
```

#### 解決方法

1. **使用中のポートを確認**
```bash
sudo netstat -tulpn | grep 8083
```

2. **docker-compose.ymlのポート変更**
```bash
nano docker-compose.yml
```

ポート設定を変更：
```yaml
ports:
  - "8084:80"  # 8083から8084に変更
```

3. **再起動**
```bash
docker compose down
docker compose up -d
```

### ディスク容量不足

#### 症状
```
no space left on device
```

#### 解決方法

1. **ディスク使用量確認**
```bash
df -h
docker system df
```

2. **不要なDockerリソースの削除**
```bash
# 停止中のコンテナを削除
docker container prune -f

# 未使用のイメージを削除
docker image prune -a -f

# 未使用のボリュームを削除
docker volume prune -f

# すべての未使用リソースを削除
docker system prune -a --volumes -f
```

### Git Pull エラー

#### 症状
```
Permission denied (publickey)
```

#### 解決方法

1. **SSH鍵の確認**
```bash
ls -la ~/.ssh/github_deploy*
cat ~/.ssh/config
```

2. **GitHub接続テスト**
```bash
ssh -T git@github.com
```

3. **SSH鍵の再設定**
```bash
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub
# GitHubのDeploy keysに再登録
```

### パーミッションエラー

#### 症状
```
Permission denied
```

#### 解決方法

1. **ディレクトリの所有者確認**
```bash
ls -la /opt/flash-quiz
```

2. **所有者の変更**
```bash
sudo chown -R $USER:$USER /opt/flash-quiz
```

3. **データディレクトリのパーミッション**
```bash
chmod 755 ./data
chmod 755 ./data/mysql
chmod 755 ./data/nginx/logs
```

### メモリ不足

#### 症状
コンテナが頻繁に再起動する、OOM (Out of Memory) エラー

#### 解決方法

1. **メモリ使用量確認**
```bash
free -h
docker stats
```

2. **不要なプロセスの停止**
```bash
# 不要なサービスを停止
sudo systemctl stop <service-name>
```

3. **Swapの設定**
```bash
# Swap領域の確認
sudo swapon --show

# Swapファイルの作成（2GB）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永続化
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 更新手順

アプリケーションを更新する際の手順です。

### 1. 手動更新

```bash
cd /opt/flash-quiz

# 最新のコードを取得
git pull origin main

# コンテナの再ビルドと再起動
docker compose up -d --build

# ログで確認
docker compose logs -f
```

### 2. デプロイスクリプトを使用（推奨）

```bash
cd /opt/flash-quiz
./scripts/deploy.sh
```

デプロイスクリプトは以下を自動実行します：
- Gitからの最新コード取得
- 環境変数の確認
- Dockerイメージのビルド
- コンテナの再起動
- ヘルスチェック
- エラーハンドリング

### 3. ロールバック

問題が発生した場合、前のバージョンに戻す：

```bash
cd /opt/flash-quiz

# コミット履歴を確認
git log --oneline -10

# 特定のコミットに戻す
git checkout <commit-hash>

# コンテナの再ビルド
docker compose up -d --build
```

### 4. データベースのバックアップ

更新前にデータベースをバックアップすることを推奨：

```bash
# バックアップディレクトリの作成
mkdir -p /opt/flash-quiz/backups

# バックアップの実行
docker compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} flash_quiz > /opt/flash-quiz/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# バックアップの確認
ls -lh /opt/flash-quiz/backups/
```

### 5. データベースのリストア

```bash
# バックアップファイルを確認
ls -lh /opt/flash-quiz/backups/

# リストア
docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} flash_quiz < /opt/flash-quiz/backups/backup_YYYYMMDD_HHMMSS.sql
```

---

## セキュリティのベストプラクティス

### 1. ファイアウォールの設定

```bash
# UFWのインストール
sudo apt install ufw -y

# デフォルトポリシーの設定
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 必要なポートを開放
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# UFWの有効化
sudo ufw enable

# 状態確認
sudo ufw status
```

### 2. 自動セキュリティアップデート

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. SSH設定の強化

```bash
sudo nano /etc/ssh/sshd_config
```

以下を設定：
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

設定を反映：
```bash
sudo systemctl restart sshd
```

### 4. 定期的なバックアップ

cronで自動バックアップを設定：

```bash
crontab -e
```

以下を追加（毎日午前3時にバックアップ）：
```
0 3 * * * cd /opt/flash-quiz && docker compose exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} flash_quiz > /opt/flash-quiz/backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

---

## 監視とメンテナンス

### 1. ログのローテーション

```bash
sudo nano /etc/logrotate.d/flash-quiz
```

以下を追加：
```
/opt/flash-quiz/data/nginx/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        docker compose exec nginx nginx -s reload > /dev/null 2>&1
    endscript
}
```

### 2. ディスク使用量の監視

```bash
# ディスク使用量確認スクリプト
cat > /opt/flash-quiz/scripts/check-disk.sh << 'EOF'
#!/bin/bash
THRESHOLD=80
USAGE=$(df -h /opt/flash-quiz | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $USAGE -gt $THRESHOLD ]; then
    echo "警告: ディスク使用量が ${USAGE}% です"
    # 必要に応じてアラート送信
fi
EOF

chmod +x /opt/flash-quiz/scripts/check-disk.sh
```

### 3. コンテナヘルスチェック

```bash
# ヘルスチェックスクリプト
cat > /opt/flash-quiz/scripts/health-check.sh << 'EOF'
#!/bin/bash
cd /opt/flash-quiz

# コンテナの状態確認
UNHEALTHY=$(docker compose ps | grep -v "Up (healthy)" | grep "Up" | wc -l)

if [ $UNHEALTHY -gt 0 ]; then
    echo "警告: 一部のコンテナが正常ではありません"
    docker compose ps
fi
EOF

chmod +x /opt/flash-quiz/scripts/health-check.sh
```

---

## まとめ

このガイドに従うことで、GitHubプライベートリポジトリを使用してフラッシュクイズアプリケーションを安全にデプロイできます。

### チェックリスト

デプロイ完了後、以下を確認してください：

- [ ] GitHubプライベートリポジトリが作成されている
- [ ] ローカルからGitHubにコードがプッシュされている
- [ ] サーバーにGit、Docker、Docker Composeがインストールされている
- [ ] SSH鍵が設定され、GitHubに接続できる
- [ ] アプリケーションがクローンされている
- [ ] 環境変数が正しく設定されている
- [ ] すべてのコンテナが正常に起動している
- [ ] ヘルスチェックが成功している
- [ ] ブラウザでアプリケーションにアクセスできる
- [ ] Datadog監視が機能している
- [ ] バックアップが設定されている
- [ ] ファイアウォールが設定されている

### サポート

問題が発生した場合は、以下を確認してください：

1. このガイドのトラブルシューティングセクション
2. `docker compose logs` でログを確認
3. GitHubのIssueで質問

---

**作成日**: 2026-05-05  
**バージョン**: 1.0.0  
**対象環境**: Ubuntu 20.04 LTS以上、Docker 20.10以上