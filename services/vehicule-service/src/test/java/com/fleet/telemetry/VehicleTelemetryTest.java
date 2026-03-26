package com.fleet.telemetry;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.metrics.DoubleHistogramBuilder;
import io.opentelemetry.api.metrics.LongCounter;
import io.opentelemetry.api.metrics.LongCounterBuilder;
import io.opentelemetry.api.metrics.LongHistogram;
import io.opentelemetry.api.metrics.LongHistogramBuilder;
import io.opentelemetry.api.metrics.Meter;
import io.opentelemetry.api.trace.Tracer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VehicleTelemetryTest {

    @Mock
    private OpenTelemetry openTelemetry;

    @Mock
    private Meter meter;

    @Mock
    private Tracer tracer;

    @Mock
    private LongCounter longCounter;

    @Mock
    private LongCounterBuilder longCounterBuilder;

    @Mock
    private LongHistogram longHistogram;

    @Mock
    private DoubleHistogramBuilder doubleHistogramBuilder;

    @Mock
    private LongHistogramBuilder longHistogramBuilder;

    private VehicleTelemetry vehicleTelemetry;

    @BeforeEach
    void setUp() {
        when(openTelemetry.getTracer(anyString(), anyString())).thenReturn(tracer);
        when(openTelemetry.getMeter(anyString())).thenReturn(meter);

        when(meter.counterBuilder(anyString())).thenReturn(longCounterBuilder);
        when(longCounterBuilder.setDescription(anyString())).thenReturn(longCounterBuilder);
        when(longCounterBuilder.setUnit(anyString())).thenReturn(longCounterBuilder);
        when(longCounterBuilder.build()).thenReturn(longCounter);

        when(meter.histogramBuilder(anyString())).thenReturn(doubleHistogramBuilder);
        when(doubleHistogramBuilder.setDescription(anyString())).thenReturn(doubleHistogramBuilder);
        when(doubleHistogramBuilder.setUnit(anyString())).thenReturn(doubleHistogramBuilder);
        when(doubleHistogramBuilder.ofLongs()).thenReturn(longHistogramBuilder);
        when(longHistogramBuilder.build()).thenReturn(longHistogram);

        vehicleTelemetry = new VehicleTelemetry(openTelemetry);
    }

    @Test
    void shouldInitializeCorrectly() {
        assertNotNull(vehicleTelemetry.getTracer());
        assertNotNull(vehicleTelemetry.getVehiclesCreatedCounter());
        assertNotNull(vehicleTelemetry.getVehiclesDeletedCounter());
        assertNotNull(vehicleTelemetry.getOperationErrorsCounter());
        assertNotNull(vehicleTelemetry.getOperationDurationHistogram());
    }
}
