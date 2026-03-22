package com.fleet.telemetry;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.metrics.LongCounter;
import io.opentelemetry.api.metrics.LongHistogram;
import io.opentelemetry.api.metrics.Meter;
import io.opentelemetry.api.trace.Tracer;
import org.springframework.stereotype.Component;

/**
 * Configuration centralisée d'OpenTelemetry.
 *
 * Les 3 piliers d'OpenTelemetry :
 *
 * 1. TRACES  - Suivre le parcours d'une requête à travers les services.
 *              Chaque opération est un "Span". Les spans s'emboîtent
 *              pour former une trace complète (ex: HTTP → Service → DB).
 *
 * 2. MÉTRIQUES - Compteurs et mesures numériques agrégées dans le temps.
 *               Exemples : nombre de véhicules créés, temps de traitement.
 *               Contrairement aux traces (par requête), les métriques
 *               sont agrégées (totaux, moyennes, percentiles).
 *
 * 3. LOGS     - Messages de diagnostic enrichis avec le contexte de trace.
 *              Grâce à la corrélation trace_id/span_id, on peut naviguer
 *              d'un log vers la trace correspondante dans Jaeger/Zipkin.
 */
@Component
public class VehicleTelemetry {

    // ===============================================================
    // PILIER 1 : TRACER (pour créer des Spans manuels)
    // ===============================================================
    // Le Tracer permet de créer des "spans" = unités de travail.
    // Chaque span a un nom, une durée, des attributs et un statut.
    // Les spans s'emboîtent automatiquement grâce au contexte.
    private final Tracer tracer;

    // ===============================================================
    // PILIER 2 : MÉTRIQUES
    // ===============================================================
    // Le Meter crée des instruments de mesure. Il y a 3 types principaux :

    // COUNTER = compteur qui ne fait qu'augmenter (ex: nombre total de créations)
    private final LongCounter vehiclesCreatedCounter;
    private final LongCounter vehiclesDeletedCounter;
    private final LongCounter operationErrorsCounter;

    // HISTOGRAM = distribution de valeurs (ex: temps de réponse)
    // Permet de calculer percentiles (p50, p95, p99)
    private final LongHistogram operationDurationHistogram;

    public VehicleTelemetry(OpenTelemetry openTelemetry) {
        // Créer un Tracer nommé pour identifier la source des traces
        this.tracer = openTelemetry.getTracer("vehicule-service", "1.0.0");

        // Créer un Meter nommé pour les métriques
        Meter meter = openTelemetry.getMeter("vehicule-service");

        // Compteur : nombre total de véhicules créés
        this.vehiclesCreatedCounter = meter
                .counterBuilder("vehicles.created.total")
                .setDescription("Nombre total de véhicules créés")
                .setUnit("vehicules")
                .build();

        // Compteur : nombre total de véhicules supprimés
        this.vehiclesDeletedCounter = meter
                .counterBuilder("vehicles.deleted.total")
                .setDescription("Nombre total de véhicules supprimés")
                .setUnit("vehicules")
                .build();

        // Compteur : nombre total d'erreurs
        this.operationErrorsCounter = meter
                .counterBuilder("vehicles.operations.errors")
                .setDescription("Nombre total d'erreurs lors des opérations")
                .setUnit("erreurs")
                .build();

        // Histogramme : durée des opérations en millisecondes
        this.operationDurationHistogram = meter
                .histogramBuilder("vehicles.operation.duration")
                .setDescription("Durée des opérations sur les véhicules")
                .setUnit("ms")
                .ofLongs()
                .build();
    }

    // --- Accesseurs ---

    public Tracer getTracer() {
        return tracer;
    }

    public LongCounter getVehiclesCreatedCounter() {
        return vehiclesCreatedCounter;
    }

    public LongCounter getVehiclesDeletedCounter() {
        return vehiclesDeletedCounter;
    }

    public LongCounter getOperationErrorsCounter() {
        return operationErrorsCounter;
    }

    public LongHistogram getOperationDurationHistogram() {
        return operationDurationHistogram;
    }
}
