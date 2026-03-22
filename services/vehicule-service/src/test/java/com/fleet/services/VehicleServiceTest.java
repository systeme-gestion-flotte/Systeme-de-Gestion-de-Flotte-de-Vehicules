package com.fleet.services;

import com.fleet.dto.VehicleRequestDto;
import com.fleet.dto.VehicleResponseDto;
import com.fleet.entity.Vehicle;
import com.fleet.entity.Vehicle.VehicleStatus;
import com.fleet.kafka.VehicleProducer;
import com.fleet.repository.VehicleRepository;
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
    }

    @Test
    void createVehicle_Success() {
        when(vehicleRepository.existsByImmatriculation("AB-123-CD")).thenReturn(false);
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);

        VehicleResponseDto result = vehicleService.createVehicle(requestDto);

        assertNotNull(result);
        assertEquals("Renault", result.getMarque());
        assertEquals("Clio", result.getModele());
        assertEquals("AB-123-CD", result.getImmatriculation());
        verify(vehicleRepository).save(any(Vehicle.class));
        verify(vehicleProducer).sendVehicleEvent(eq("VEHICLE_CREATED"), any(VehicleResponseDto.class));
    }

    @Test
    void createVehicle_DuplicateImmatriculation_ThrowsException() {
        when(vehicleRepository.existsByImmatriculation("AB-123-CD")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> vehicleService.createVehicle(requestDto));
        verify(vehicleRepository, never()).save(any(Vehicle.class));
    }

    @Test
    void getVehicleById_Success() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));

        VehicleResponseDto result = vehicleService.getVehicleById(vehicleId);

        assertNotNull(result);
        assertEquals(vehicleId, result.getId());
        assertEquals("Renault", result.getMarque());
    }

    @Test
    void getVehicleById_NotFound_ThrowsException() {
        UUID unknownId = UUID.randomUUID();
        when(vehicleRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> vehicleService.getVehicleById(unknownId));
    }

    @Test
    void getAllVehicles_Success() {
        Vehicle vehicle2 = new Vehicle("Peugeot", "308", "EF-456-GH", "Berline", (short) 2021);
        vehicle2.setId(UUID.randomUUID());
        vehicle2.setStatut(VehicleStatus.EN_COURSE);
        vehicle2.setKilometrage(30000);
        vehicle2.setCreatedAt(LocalDateTime.now());
        vehicle2.setUpdatedAt(LocalDateTime.now());

        when(vehicleRepository.findAll()).thenReturn(Arrays.asList(vehicle, vehicle2));

        List<VehicleResponseDto> result = vehicleService.getAllVehicles();

        assertEquals(2, result.size());
        assertEquals("Renault", result.get(0).getMarque());
        assertEquals("Peugeot", result.get(1).getMarque());
    }

    @Test
    void getVehiclesByStatut_Success() {
        when(vehicleRepository.findByStatut(VehicleStatus.DISPONIBLE)).thenReturn(List.of(vehicle));

        List<VehicleResponseDto> result = vehicleService.getVehiclesByStatut("DISPONIBLE");

        assertEquals(1, result.size());
        assertEquals("DISPONIBLE", result.get(0).getStatut());
    }

    @Test
    void updateVehicle_Success() {
        VehicleRequestDto updateRequest = new VehicleRequestDto("Renault", "Megane", "AB-123-CD", "Berline", (short) 2020);
        updateRequest.setKilometrage(60000);

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);

        VehicleResponseDto result = vehicleService.updateVehicle(vehicleId, updateRequest);

        assertNotNull(result);
        verify(vehicleRepository).save(any(Vehicle.class));
        verify(vehicleProducer).sendVehicleEvent(eq("VEHICLE_UPDATED"), any(VehicleResponseDto.class));
    }

    @Test
    void updateVehicle_NotFound_ThrowsException() {
        UUID unknownId = UUID.randomUUID();
        when(vehicleRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> vehicleService.updateVehicle(unknownId, requestDto));
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
        UUID unknownId = UUID.randomUUID();
        when(vehicleRepository.existsById(unknownId)).thenReturn(false);

        assertThrows(RuntimeException.class, () -> vehicleService.deleteVehicle(unknownId));
    }
}
