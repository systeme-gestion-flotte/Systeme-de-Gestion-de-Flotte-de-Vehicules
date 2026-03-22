package com.fleet.services;

import com.fleet.dto.VehicleRequestDto;
import com.fleet.dto.VehicleResponseDto;

import java.util.List;
import java.util.UUID;

public interface VehicleService {

    VehicleResponseDto createVehicle(VehicleRequestDto request);

    VehicleResponseDto getVehicleById(UUID id);

    List<VehicleResponseDto> getAllVehicles();

    List<VehicleResponseDto> getVehiclesByStatut(String statut);

    VehicleResponseDto updateVehicle(UUID id, VehicleRequestDto request);

    VehicleResponseDto updateStatut(UUID id, String statut);

    VehicleResponseDto updateKilometrage(UUID id, Integer kilometrage);

    List<VehicleResponseDto> getDisponibles();

    void deleteVehicle(UUID id);
}
