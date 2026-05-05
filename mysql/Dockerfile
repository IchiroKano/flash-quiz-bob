FROM mysql:8.0

# ログディレクトリの作成
RUN mkdir -p /var/log/mysql && \
    chown -R mysql:mysql /var/log/mysql

# 設定ファイルのコピー
COPY conf.d/my.cnf /etc/mysql/conf.d/

# 初期化スクリプトのコピー
COPY init/*.sql /docker-entrypoint-initdb.d/

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} || exit 1

# Made with Bob
