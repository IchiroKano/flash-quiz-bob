FROM nginx:alpine

# 設定ファイルをコピー
COPY ./nginx.conf /etc/nginx/nginx.conf

# SSL証明書ディレクトリ作成
RUN mkdir -p /etc/nginx/ssl

# 自己署名証明書を生成（開発用）
RUN apk add --no-cache openssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=JP/ST=Tokyo/L=Tokyo/O=FlashQuiz/CN=localhost"

# ログディレクトリのパーミッション設定
RUN touch /var/log/nginx/access.log /var/log/nginx/error.log && \
    chown -R nginx:nginx /var/log/nginx

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

# Made with Bob
