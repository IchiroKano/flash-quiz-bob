// Datadog APM設定
// このファイルはアプリケーションの最初にインポートする必要があります

const tracer = require('dd-trace').init({
  service: process.env.DD_SERVICE || 'flash-quiz-bob-api',
  env: process.env.DD_ENV || 'production',
  version: process.env.DD_VERSION || '1.0.0',
  hostname: process.env.DD_AGENT_HOST || 'datadog-agent',
  port: process.env.DD_TRACE_AGENT_PORT || 8126,
  logInjection: true,
  analytics: true,
  runtimeMetrics: true,
  profiling: true,
  // サンプリングレート（100%トレース）
  sampleRate: parseFloat(process.env.DD_TRACE_SAMPLE_RATE || '1.0'),
  // ログレベル
  debug: process.env.DD_TRACE_DEBUG === 'true',
  // タグ設定
  tags: {
    'team': 'platform',
    'application': 'flash-quiz'
  }
});

module.exports = tracer;

// Made with Bob
