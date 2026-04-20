import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { trace } from '@opentelemetry/api';

const isTest = process.env.NODE_ENV === 'test';
let sdk: NodeSDK | null = null;

export function initTelemetry(): void {
  if (isTest) {
    console.log('OpenTelemetry SDK sauté (mode test)');
    return;
  }

  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4317',
  });

  const prometheusExporter = new PrometheusExporter({ port: 9464 });

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'conducteur-service',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
        process.env.NODE_ENV || 'development',
    }),
    traceExporter,
    metricReader: prometheusExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-pg': { enabled: true },
      }),
    ],
  });

  try {
    sdk.start();
    console.log('OpenTelemetry SDK initialisé');
  } catch (err) {
    console.warn('Impossible d\'initialiser OpenTelemetry:', err);
  }
}

export function getTracer() {
  return trace.getTracer('conducteur-service', '1.0.0');
}

export async function shutdownTelemetry(): Promise<void> {
  if (!sdk) return;
  try {
    await sdk.shutdown();
  } catch (err) {
    console.warn('Erreur lors de l\'arrêt OpenTelemetry:', err);
  }
}
