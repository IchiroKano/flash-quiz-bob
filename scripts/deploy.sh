#!/bin/bash

################################################################################
# フラッシュクイズ - デプロイスクリプト
# 
# このスクリプトは、GitHubから最新のコードを取得し、
# Dockerコンテナを再ビルド・再起動します。
#
# 使用方法:
#   ./scripts/deploy.sh
#
# 前提条件:
#   - Git、Docker、Docker Composeがインストールされていること
#   - .envファイルが設定されていること
#   - GitHubへのSSH接続が設定されていること
################################################################################

set -e  # エラーが発生したら即座に終了

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# エラーハンドラー
error_exit() {
    log_error "$1"
    exit 1
}

# バナー表示
print_banner() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║        フラッシュクイズ - デプロイスクリプト                ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
}

# 前提条件のチェック
check_prerequisites() {
    log_info "前提条件をチェックしています..."
    
    # Gitのチェック
    if ! command -v git &> /dev/null; then
        error_exit "Gitがインストールされていません"
    fi
    
    # Dockerのチェック
    if ! command -v docker &> /dev/null; then
        error_exit "Dockerがインストールされていません"
    fi
    
    # Docker Composeのチェック
    if ! docker compose version &> /dev/null; then
        error_exit "Docker Composeがインストールされていません"
    fi
    
    # .envファイルのチェック
    if [ ! -f .env ]; then
        error_exit ".envファイルが見つかりません。.env.exampleを参考に作成してください"
    fi
    
    log_success "前提条件のチェックが完了しました"
}

# 現在のブランチとコミットを表示
show_current_version() {
    log_info "現在のバージョン情報:"
    echo "  ブランチ: $(git branch --show-current)"
    echo "  コミット: $(git rev-parse --short HEAD)"
    echo "  日時: $(git log -1 --format=%cd)"
    echo ""
}

# Gitから最新のコードを取得
pull_latest_code() {
    log_info "Gitから最新のコードを取得しています..."
    
    # 現在のブランチを取得
    CURRENT_BRANCH=$(git branch --show-current)
    
    # リモートの変更を取得
    git fetch origin || error_exit "git fetchに失敗しました"
    
    # ローカルの変更があるかチェック
    if ! git diff-index --quiet HEAD --; then
        log_warning "ローカルに未コミットの変更があります"
        read -p "変更を破棄して続行しますか? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error_exit "デプロイを中止しました"
        fi
        git reset --hard HEAD
    fi
    
    # 最新のコードをプル
    git pull origin "$CURRENT_BRANCH" || error_exit "git pullに失敗しました"
    
    log_success "最新のコードを取得しました"
}

# 新しいバージョン情報を表示
show_new_version() {
    log_info "新しいバージョン情報:"
    echo "  ブランチ: $(git branch --show-current)"
    echo "  コミット: $(git rev-parse --short HEAD)"
    echo "  日時: $(git log -1 --format=%cd)"
    echo ""
}

# データベースのバックアップ
backup_database() {
    log_info "データベースをバックアップしています..."
    
    # バックアップディレクトリの作成
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    
    # バックアップファイル名
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # MySQLコンテナが起動しているかチェック
    if docker compose ps mysql | grep -q "Up"; then
        # 環境変数を読み込む
        source .env
        
        # バックアップを実行
        docker compose exec -T mysql mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" > "$BACKUP_FILE" 2>/dev/null || {
            log_warning "データベースのバックアップに失敗しました（コンテナが起動していない可能性があります）"
            return 0
        }
        
        log_success "データベースをバックアップしました: $BACKUP_FILE"
        
        # 古いバックアップを削除（7日以上前のもの）
        find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete 2>/dev/null || true
    else
        log_warning "MySQLコンテナが起動していないため、バックアップをスキップします"
    fi
}

# Dockerイメージのビルド
build_images() {
    log_info "Dockerイメージをビルドしています..."
    
    docker compose build --no-cache || error_exit "Dockerイメージのビルドに失敗しました"
    
    log_success "Dockerイメージのビルドが完了しました"
}

# コンテナの停止
stop_containers() {
    log_info "既存のコンテナを停止しています..."
    
    docker compose down || error_exit "コンテナの停止に失敗しました"
    
    log_success "コンテナを停止しました"
}

# コンテナの起動
start_containers() {
    log_info "コンテナを起動しています..."
    
    docker compose up -d || error_exit "コンテナの起動に失敗しました"
    
    log_success "コンテナを起動しました"
}

# ヘルスチェック
health_check() {
    log_info "ヘルスチェックを実行しています..."
    
    # 最大待機時間（秒）
    MAX_WAIT=120
    WAIT_INTERVAL=5
    ELAPSED=0
    
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        # すべてのコンテナが起動しているかチェック
        RUNNING=$(docker compose ps | grep -c "Up" || true)
        TOTAL=$(docker compose ps | grep -c "flash-quiz-bob" || true)
        
        if [ "$RUNNING" -eq "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
            # Nginxのヘルスチェック
            if curl -f -s http://localhost:8083/health > /dev/null 2>&1; then
                log_success "すべてのコンテナが正常に起動しました"
                return 0
            fi
        fi
        
        echo -n "."
        sleep $WAIT_INTERVAL
        ELAPSED=$((ELAPSED + WAIT_INTERVAL))
    done
    
    echo ""
    log_error "ヘルスチェックがタイムアウトしました"
    log_info "コンテナの状態:"
    docker compose ps
    log_info "ログを確認してください: docker compose logs"
    return 1
}

# デプロイ後の確認
post_deploy_check() {
    log_info "デプロイ後の確認を実行しています..."
    
    echo ""
    echo "コンテナの状態:"
    docker compose ps
    echo ""
    
    # APIのヘルスチェック
    log_info "APIのヘルスチェック:"
    if curl -f -s http://localhost:8083/api/health | jq . 2>/dev/null; then
        log_success "APIは正常に動作しています"
    else
        log_warning "APIのヘルスチェックに失敗しました"
    fi
    
    echo ""
    
    # カテゴリ一覧の取得テスト
    log_info "カテゴリ一覧の取得テスト:"
    if curl -f -s http://localhost:8083/api/categories | jq -r '.[0].name' 2>/dev/null; then
        log_success "カテゴリの取得に成功しました"
    else
        log_warning "カテゴリの取得に失敗しました"
    fi
    
    echo ""
}

# ログの表示
show_logs() {
    log_info "最新のログを表示します（Ctrl+Cで終了）..."
    echo ""
    sleep 2
    docker compose logs -f --tail=50
}

# ロールバック
rollback() {
    log_error "デプロイに失敗しました。ロールバックを実行しますか?"
    read -p "ロールバックしますか? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "ロールバックを実行しています..."
        
        # 前のコミットに戻す
        git reset --hard HEAD~1
        
        # コンテナを再起動
        docker compose down
        docker compose up -d --build
        
        log_success "ロールバックが完了しました"
    fi
}

# クリーンアップ
cleanup() {
    log_info "未使用のDockerリソースをクリーンアップしています..."
    
    # 停止中のコンテナを削除
    docker container prune -f > /dev/null 2>&1 || true
    
    # 未使用のイメージを削除
    docker image prune -f > /dev/null 2>&1 || true
    
    log_success "クリーンアップが完了しました"
}

# メイン処理
main() {
    print_banner
    
    # 開始時刻を記録
    START_TIME=$(date +%s)
    
    # 前提条件のチェック
    check_prerequisites
    
    # 現在のバージョンを表示
    show_current_version
    
    # デプロイの確認
    read -p "デプロイを開始しますか? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "デプロイを中止しました"
        exit 0
    fi
    
    # データベースのバックアップ
    backup_database
    
    # 最新のコードを取得
    pull_latest_code
    
    # 新しいバージョンを表示
    show_new_version
    
    # Dockerイメージのビルド
    build_images
    
    # コンテナの停止
    stop_containers
    
    # コンテナの起動
    start_containers
    
    # ヘルスチェック
    if ! health_check; then
        rollback
        error_exit "デプロイに失敗しました"
    fi
    
    # デプロイ後の確認
    post_deploy_check
    
    # クリーンアップ
    cleanup
    
    # 終了時刻を記録
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║              デプロイが正常に完了しました！                 ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    log_success "デプロイ時間: ${DURATION}秒"
    echo ""
    log_info "アプリケーションURL: http://localhost:8083/flashquiz_bob/"
    log_info "API URL: http://localhost:8083/api/"
    echo ""
    log_info "ログを確認する場合: docker compose logs -f"
    log_info "コンテナの状態を確認する場合: docker compose ps"
    echo ""
    
    # ログを表示するか確認
    read -p "ログをリアルタイムで表示しますか? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        show_logs
    fi
}

# スクリプトの実行
main "$@"

# Made with Bob
