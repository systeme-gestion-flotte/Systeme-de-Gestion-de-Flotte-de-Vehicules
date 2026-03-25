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
import java.util.Map;
import java.util.UUID;


@RestController
@RequestMapping("/api/vehicules")
public class VehicleController {

    private static final Logger log = LoggerFactory.getLogger(VehicleController.class);
    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping
    public ResponseEntity<VehicleResponseDto> createVehicle(@Valid @RequestBody VehicleRequestDto request) {
        log.info("POST /api/vehicules - Création");
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.createVehicle(request));
    }

    @GetMapping
    public ResponseEntity<List<VehicleResponseDto>> getAllVehicles() {
        log.info("GET /api/vehicules - Liste complète");
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<VehicleResponseDto>> getDisponibles() {
        log.info("GET /api/vehicules/disponibles - Filtrage disponibles");
        return ResponseEntity.ok(vehicleService.getDisponibles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponseDto> getVehicleById(@PathVariable UUID id) {
        log.info("GET /api/vehicules/{} - Détail", id);
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<VehicleResponseDto>> getVehiclesByStatut(@PathVariable String statut) {
        log.info("GET /api/vehicules/statut/{} - Filtrage par statut", statut);
        return ResponseEntity.ok(vehicleService.getVehiclesByStatut(statut));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleResponseDto> updateVehicle(@PathVariable UUID id,
                                                             @Valid @RequestBody VehicleRequestDto request) {
        log.info("PUT /api/vehicules/{} - Mise à jour complète", id);
        return ResponseEntity.ok(vehicleService.updateVehicle(id, request));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<VehicleResponseDto> updateStatut(@PathVariable UUID id,
                                                           @RequestBody Map<String, String> body) {
        String statut = body.get("statut");
        log.info("PATCH /api/vehicules/{}/statut - Nouveau statut: {}", id, statut);
        return ResponseEntity.ok(vehicleService.updateStatut(id, statut));
    }

    @PatchMapping("/{id}/kilometrage")
    public ResponseEntity<VehicleResponseDto> updateKilometrage(@PathVariable UUID id,
                                                               @RequestBody Map<String, Integer> body) {
        Integer kilometrage = body.get("kilometrage");
        log.info("PATCH /api/vehicules/{}/kilometrage - Nouveau kilométrage: {}", id, kilometrage);
        return ResponseEntity.ok(vehicleService.updateKilometrage(id, kilometrage));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable UUID id) {
        log.info("DELETE /api/vehicules/{} - Suppression", id);
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }
}
