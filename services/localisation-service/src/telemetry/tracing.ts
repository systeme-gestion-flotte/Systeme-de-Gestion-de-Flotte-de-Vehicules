import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { trace } from '@opentelemetry/api';

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
});

// Port 9465 pour éviter le conflit avec conducteur-service (9464)
const prometheusExporter = new PrometheusExporter({ port: 9465 });

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'localisation-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter: jaegerExporter,
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
    }),
  ],
});

export function initTelemetry(): void {
  try {
    sdk.start();
    console.log('OpenTelemetry SDK initialisé pour localisation-service');
  } catch (err) {
    console.warn("Impossible d'initialiser OpenTelemetry:", err);
  }
}

export function getTracer() {
  return trace.getTracer('localisation-service', '1.0.0');
}

export async function shutdownTelemetry(): Promise<void> {
  try {
    await sdk.shutdown();
  } catch (err) {
    console.warn("Erreur lors de l'arrêt OpenTelemetry:", err);
  }
}
