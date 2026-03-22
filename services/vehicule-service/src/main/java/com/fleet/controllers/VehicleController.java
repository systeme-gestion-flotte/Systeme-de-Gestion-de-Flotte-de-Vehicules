package com.fleet.controllers;

import com.fleet.dto.VehicleRequestDto;
import com.fleet.dto.VehicleResponseDto;
import com.fleet.services.VehicleService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private static final Logger log = LoggerFactory.getLogger(VehicleController.class);

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping
    public ResponseEntity<VehicleResponseDto> createVehicle(@Valid @RequestBody VehicleRequestDto request) {
        log.info("POST /api/vehicles - Création d'un véhicule");
        VehicleResponseDto response = vehicleService.createVehicle(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<VehicleResponseDto>> getAllVehicles() {
        log.info("GET /api/vehicles - Liste des véhicules");
        List<VehicleResponseDto> vehicles = vehicleService.getAllVehicles();
        return ResponseEntity.ok(vehicles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponseDto> getVehicleById(@PathVariable UUID id) {
        log.info("GET /api/vehicles/{} - Détail d'un véhicule", id);
        VehicleResponseDto vehicle = vehicleService.getVehicleById(id);
        return ResponseEntity.ok(vehicle);
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<VehicleResponseDto>> getVehiclesByStatut(@PathVariable String statut) {
        log.info("GET /api/vehicles/statut/{} - Filtrage par statut", statut);
        List<VehicleResponseDto> vehicles = vehicleService.getVehiclesByStatut(statut);
        return ResponseEntity.ok(vehicles);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleResponseDto> updateVehicle(@PathVariable UUID id,
                                                             @Valid @RequestBody VehicleRequestDto request) {
        log.info("PUT /api/vehicles/{} - Mise à jour d'un véhicule", id);
        VehicleResponseDto response = vehicleService.updateVehicle(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable UUID id) {
        log.info("DELETE /api/vehicles/{} - Suppression d'un véhicule", id);
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }
}
