package com.fleet.controllers;

import com.fleet.dto.VehicleRequestDto;
import com.fleet.dto.VehicleResponseDto;
import com.fleet.services.VehicleService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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

    // ─── CREATE ──────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('admin', 'manager')")
    public ResponseEntity<VehicleResponseDto> createVehicle(
            @Valid @RequestBody VehicleRequestDto request,
            @AuthenticationPrincipal Jwt jwt) {

        log.info("POST /api/vehicules - Création par [{}] role(s): {}",
                jwt.getClaimAsString("preferred_username"),
                jwt.getClaimAsStringList("realm_access"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vehicleService.createVehicle(request));
    }

    // ─── READ ─────────────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'manager', 'technicien', 'utilisateur')")
    public ResponseEntity<List<VehicleResponseDto>> getAllVehicles(
            @AuthenticationPrincipal Jwt jwt) {

        log.info("GET /api/vehicules - Liste complète demandée par [{}]",
                jwt.getClaimAsString("preferred_username"));
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasAnyRole('admin', 'manager', 'technicien', 'utilisateur')")
    public ResponseEntity<List<VehicleResponseDto>> getDisponibles(
            @AuthenticationPrincipal Jwt jwt) {

        log.info("GET /api/vehicules/disponibles - par [{}]",
                jwt.getClaimAsString("preferred_username"));
        return ResponseEntity.ok(vehicleService.getDisponibles());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'manager', 'technicien', 'utilisateur')")
    public ResponseEntity<VehicleResponseDto> getVehicleById(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        log.info("GET /api/vehicules/{} - par [{}]",
                id, jwt.getClaimAsString("preferred_username"));
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @GetMapping("/statut/{statut}")
    @PreAuthorize("hasAnyRole('admin', 'manager', 'technicien', 'utilisateur')")
    public ResponseEntity<List<VehicleResponseDto>> getVehiclesByStatut(
            @PathVariable String statut,
            @AuthenticationPrincipal Jwt jwt) {

        log.info("GET /api/vehicules/statut/{} - par [{}]",
                statut, jwt.getClaimAsString("preferred_username"));
        return ResponseEntity.ok(vehicleService.getVehiclesByStatut(statut));
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'manager')")
    public ResponseEntity<VehicleResponseDto> updateVehicle(
            @PathVariable UUID id,
            @Valid @RequestBody VehicleRequestDto request,
            @AuthenticationPrincipal Jwt jwt) {

        log.info("PUT /api/vehicules/{} - Mise à jour par [{}]",
                id, jwt.getClaimAsString("preferred_username"));
        return ResponseEntity.ok(vehicleService.updateVehicle(id, request));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('admin', 'manager', 'technicien')")
    public ResponseEntity<VehicleResponseDto> updateStatut(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        String statut = body.get("statut");
        log.info("PATCH /api/vehicules/{}/statut - [{}] -> statut: {}",
                id, jwt.getClaimAsString("preferred_username"), statut);
        return ResponseEntity.ok(vehicleService.updateStatut(id, statut));
    }

    @PatchMapping("/{id}/kilometrage")
    @PreAuthorize("hasAnyRole('admin', 'manager', 'technicien')")
    public ResponseEntity<VehicleResponseDto> updateKilometrage(
            @PathVariable UUID id,
            @RequestBody Map<String, Integer> body,
            @AuthenticationPrincipal Jwt jwt) {

        Integer kilometrage = body.get("kilometrage");
        log.info("PATCH /api/vehicules/{}/kilometrage - [{}] -> km: {}",
                id, jwt.getClaimAsString("preferred_username"), kilometrage);
        return ResponseEntity.ok(vehicleService.updateKilometrage(id, kilometrage));
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Void> deleteVehicle(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        log.info("DELETE /api/vehicules/{} - Suppression par [{}]",
                id, jwt.getClaimAsString("preferred_username"));
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }
}
