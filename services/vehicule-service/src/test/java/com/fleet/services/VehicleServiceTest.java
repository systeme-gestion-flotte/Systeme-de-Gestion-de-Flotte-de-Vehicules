package com.fleet.services;

import com.fleet.dto.VehicleRequestDto;
import com.fleet.dto.VehicleResponseDto;
import com.fleet.entity.Vehicle;
import com.fleet.entity.Vehicle.VehicleStatus;
import com.fleet.kafka.VehicleProducer;
import com.fleet.repository.VehicleRepository;
import com.fleet.telemetry.VehicleTelemetry;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.metrics.LongCounter;
import io.opentelemetry.api.metrics.LongHistogram;
import io.opentelemetry.api.trace.Tracer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private VehicleProducer vehicleProducer;

    @Mock
    private VehicleTelemetry telemetry;

    @Mock
    private Tracer tracer;

    @Mock
    private LongCounter longCounter;

    @Mock
    private io.opentelemetry.api.metrics.DoubleHistogramBuilder doubleHistogramBuilder;

    @Mock
    private LongHistogram longHistogram;

    @InjectMocks
    private VehicleServiceImpl vehicleService;

    private Vehicle vehicle;
    private VehicleRequestDto requestDto;
    private UUID vehicleId;

    @BeforeEach
    void setUp() {
        vehicleId = UUID.randomUUID();

        vehicle = new Vehicle("Renault", "Clio", "AB-123-CD", "Berline", (short) 2020);
        vehicle.setId(vehicleId);
        vehicle.setStatut(VehicleStatus.DISPONIBLE);
        vehicle.setKilometrage(50000);
        vehicle.setCreatedAt(LocalDateTime.now());
        vehicle.setUpdatedAt(LocalDateTime.now());

        requestDto = new VehicleRequestDto("Renault", "Clio", "AB-123-CD", "Berline", (short) 2020);
        requestDto.setKilometrage(50000);

        // Configuration des mocks de télémétrie
        lenient().when(telemetry.getTracer()).thenReturn(tracer);
        lenient().when(telemetry.getVehiclesCreatedCounter()).thenReturn(longCounter);
        lenient().when(telemetry.getVehiclesDeletedCounter()).thenReturn(longCounter);
        lenient().when(telemetry.getOperationErrorsCounter()).thenReturn(longCounter);
        lenient().when(telemetry.getOperationDurationHistogram()).thenReturn(longHistogram);
    }

    @Test
    void createVehicle_Success() {
        when(vehicleRepository.existsByImmatriculation("AB-123-CD")).thenReturn(false);
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);

        VehicleResponseDto result = vehicleService.createVehicle(requestDto);

        assertNotNull(result);
        assertEquals(vehicleId, result.getId_vehicule());
        assertEquals("Renault", result.getMarque());
        verify(vehicleProducer).sendVehicleEvent(eq("VEHICLE_CREATED"), any(VehicleResponseDto.class));
    }

    @Test
    void createVehicle_DuplicateImmatriculation_ThrowsException() {
        when(vehicleRepository.existsByImmatriculation("AB-123-CD")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> vehicleService.createVehicle(requestDto));
        verify(telemetry.getOperationErrorsCounter()).add(eq(1L), any(Attributes.class));
    }

    @Test
    void getVehicleById_Success() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));

        VehicleResponseDto result = vehicleService.getVehicleById(vehicleId);

        assertNotNull(result);
        assertEquals(vehicleId, result.getId_vehicule());
    }

    @Test
    void getVehicleById_NotFound_ThrowsException() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> vehicleService.getVehicleById(vehicleId));
        verify(telemetry.getOperationErrorsCounter()).add(eq(1L), any(Attributes.class));
    }

    @Test
    void getAllVehicles_Success() {
        when(vehicleRepository.findAll()).thenReturn(Arrays.asList(vehicle));
        List<VehicleResponseDto> result = vehicleService.getAllVehicles();
        assertEquals(1, result.size());
        assertEquals(vehicleId, result.get(0).getId_vehicule());
    }

    @Test
    void getDisponibles_Success() {
        when(vehicleRepository.findByStatut(VehicleStatus.DISPONIBLE)).thenReturn(Arrays.asList(vehicle));
        List<VehicleResponseDto> result = vehicleService.getDisponibles();
        assertEquals(1, result.size());
    }

    @Test
    void getVehiclesByStatut_Success() {
        when(vehicleRepository.findByStatut(VehicleStatus.DISPONIBLE)).thenReturn(Arrays.asList(vehicle));
        List<VehicleResponseDto> result = vehicleService.getVehiclesByStatut("DISPONIBLE");
        assertEquals(1, result.size());
    }

    @Test
    void updateVehicle_Success() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);

        VehicleResponseDto result = vehicleService.updateVehicle(vehicleId, requestDto);

        assertNotNull(result);
        assertEquals(vehicleId, result.getId_vehicule());
    }

    @Test
    void updateStatut_Success() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);

        VehicleResponseDto result = vehicleService.updateStatut(vehicleId, "EN_MAINTENANCE");

        assertNotNull(result);
        verify(vehicleProducer).sendVehicleEvent(eq("VEHICLE_UPDATED"), any(VehicleResponseDto.class));
    }

    @Test
    void updateKilometrage_Success() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);

        VehicleResponseDto result = vehicleService.updateKilometrage(vehicleId, 60000);

        assertNotNull(result);
        verify(vehicleProducer).sendVehicleEvent(eq("VEHICLE_UPDATED"), any(VehicleResponseDto.class));
    }

    @Test
    void deleteVehicle_Success() {
        when(vehicleRepository.existsById(vehicleId)).thenReturn(true);
        vehicleService.deleteVehicle(vehicleId);
        verify(vehicleRepository).deleteById(vehicleId);
        verify(vehicleProducer).sendVehicleEvent(eq("VEHICLE_DELETED"), any(VehicleResponseDto.class));
    }

    @Test
    void deleteVehicle_NotFound_ThrowsException() {
        when(vehicleRepository.existsById(vehicleId)).thenReturn(false);
        assertThrows(RuntimeException.class, () -> vehicleService.deleteVehicle(vehicleId));
    }
}
