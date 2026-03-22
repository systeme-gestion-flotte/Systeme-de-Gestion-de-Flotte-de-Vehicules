package com.fleet.services;

import com.fleet.dto.VehicleRequestDto;
import com.fleet.dto.VehicleResponseDto;
import com.fleet.entity.Vehicle;
import com.fleet.entity.Vehicle.VehicleStatus;
import com.fleet.kafka.VehicleProducer;
import com.fleet.repository.VehicleRepository;
import com.fleet.telemetry.VehicleTelemetry;

import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.instrumentation.annotations.SpanAttribute;
import io.opentelemetry.instrumentation.annotations.WithSpan;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implémentation du service véhicule alignée avec la spec OpenAPI.
 * Utilise id_vehicule au lieu de id pour le DTO.
 */
@Service
@Transactional
public class VehicleServiceImpl implements VehicleService {

    private static final Logger log = LoggerFactory.getLogger(VehicleServiceImpl.class);

    private final VehicleRepository vehicleRepository;
    private final VehicleProducer vehicleProducer;
    private final VehicleTelemetry telemetry;

    public VehicleServiceImpl(VehicleRepository vehicleRepository,
                              VehicleProducer vehicleProducer,
                              VehicleTelemetry telemetry) {
        this.vehicleRepository = vehicleRepository;
        this.vehicleProducer = vehicleProducer;
        this.telemetry = telemetry;
    }

    @Override
    @WithSpan("createVehicle")
    public VehicleResponseDto createVehicle(VehicleRequestDto request) {
        long startTime = System.currentTimeMillis();
        enrichLogsWithTraceContext();
        log.info("Création d'un véhicule: {} {} [immat={}]",
                request.getMarque(), request.getModele(), request.getImmatriculation());

        try {
            Span currentSpan = Span.current();
            currentSpan.setAttribute("vehicle.marque", request.getMarque());
            currentSpan.setAttribute("vehicle.immatriculation", request.getImmatriculation());

            if (vehicleRepository.existsByImmatriculation(request.getImmatriculation())) {
                currentSpan.setStatus(StatusCode.ERROR, "Immatriculation dupliquée");
                telemetry.getOperationErrorsCounter().add(1,
                        Attributes.of(AttributeKey.stringKey("operation"), "create",
                                       AttributeKey.stringKey("error.type"), "duplicate"));
                throw new IllegalArgumentException("L'immatriculation " + request.getImmatriculation() + " existe déjà");
            }

            Vehicle vehicle = mapToEntity(request);
            Vehicle saved = vehicleRepository.save(vehicle);

            currentSpan.setAttribute("vehicle.id", saved.getId().toString());
            VehicleResponseDto response = mapToDto(saved);
            vehicleProducer.sendVehicleEvent("VEHICLE_CREATED", response);

            telemetry.getVehiclesCreatedCounter().add(1,
                    Attributes.of(AttributeKey.stringKey("vehicle.type"), saved.getType()));

            return response;
        } finally {
            recordDuration("create", startTime);
        }
    }

    @Override
    @WithSpan("getVehicleById")
    @Transactional(readOnly = true)
    public VehicleResponseDto getVehicleById(@SpanAttribute("vehicle.id") UUID id) {
        enrichLogsWithTraceContext();
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> {
                    Span.current().setStatus(StatusCode.ERROR, "Non trouvé");
                    telemetry.getOperationErrorsCounter().add(1,
                            Attributes.of(AttributeKey.stringKey("operation"), "getById",
                                           AttributeKey.stringKey("error.type"), "not_found"));
                    return new RuntimeException("Véhicule non trouvé: " + id);
                });
        return mapToDto(vehicle);
    }

    @Override
    @WithSpan("getAllVehicles")
    @Transactional(readOnly = true)
    public List<VehicleResponseDto> getAllVehicles() {
        enrichLogsWithTraceContext();
        List<VehicleResponseDto> result = vehicleRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        Span.current().setAttribute("vehicles.count", result.size());
        return result;
    }

    @Override
    @WithSpan("getDisponibles")
    @Transactional(readOnly = true)
    public List<VehicleResponseDto> getDisponibles() {
        enrichLogsWithTraceContext();
        List<VehicleResponseDto> result = vehicleRepository.findByStatut(VehicleStatus.DISPONIBLE).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        Span.current().setAttribute("vehicles.count", result.size());
        return result;
    }

    @Override
    @WithSpan("getVehiclesByStatut")
    @Transactional(readOnly = true)
    public List<VehicleResponseDto> getVehiclesByStatut(@SpanAttribute("vehicle.statut") String statut) {
        enrichLogsWithTraceContext();
        VehicleStatus status = VehicleStatus.valueOf(statut.toUpperCase());
        return vehicleRepository.findByStatut(status).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @WithSpan("updateVehicle")
    public VehicleResponseDto updateVehicle(@SpanAttribute("vehicle.id") UUID id, VehicleRequestDto request) {
        long startTime = System.currentTimeMillis();
        enrichLogsWithTraceContext();
        try {
            Vehicle vehicle = vehicleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Véhicule non trouvé: " + id));

            vehicle.setMarque(request.getMarque());
            vehicle.setModele(request.getModele());
            vehicle.setImmatriculation(request.getImmatriculation());
            vehicle.setType(request.getType());
            vehicle.setAnnee(request.getAnnee());
            if (request.getStatut() != null) vehicle.setStatut(VehicleStatus.valueOf(request.getStatut().toUpperCase()));
            if (request.getKilometrage() != null) vehicle.setKilometrage(request.getKilometrage());

            Vehicle updated = vehicleRepository.save(vehicle);
            VehicleResponseDto response = mapToDto(updated);
            vehicleProducer.sendVehicleEvent("VEHICLE_UPDATED", response);
            return response;
        } finally {
            recordDuration("update", startTime);
        }
    }

    @Override
    @WithSpan("updateStatut")
    public VehicleResponseDto updateStatut(@SpanAttribute("vehicle.id") UUID id, String statut) {
        long startTime = System.currentTimeMillis();
        enrichLogsWithTraceContext();
        try {
            Vehicle vehicle = vehicleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Véhicule non trouvé: " + id));
            vehicle.setStatut(VehicleStatus.valueOf(statut.toUpperCase()));
            Vehicle updated = vehicleRepository.save(vehicle);
            VehicleResponseDto response = mapToDto(updated);
            vehicleProducer.sendVehicleEvent("VEHICLE_UPDATED", response);
            return response;
        } finally {
            recordDuration("update_statut", startTime);
        }
    }

    @Override
    @WithSpan("updateKilometrage")
    public VehicleResponseDto updateKilometrage(@SpanAttribute("vehicle.id") UUID id, Integer kilometrage) {
        long startTime = System.currentTimeMillis();
        enrichLogsWithTraceContext();
        try {
            Vehicle vehicle = vehicleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Véhicule non trouvé: " + id));
            vehicle.setKilometrage(kilometrage);
            Vehicle updated = vehicleRepository.save(vehicle);
            VehicleResponseDto response = mapToDto(updated);
            vehicleProducer.sendVehicleEvent("VEHICLE_UPDATED", response);
            return response;
        } finally {
            recordDuration("update_kilometrage", startTime);
        }
    }

    @Override
    @WithSpan("deleteVehicle")
    public void deleteVehicle(@SpanAttribute("vehicle.id") UUID id) {
        long startTime = System.currentTimeMillis();
        enrichLogsWithTraceContext();
        try {
            if (!vehicleRepository.existsById(id)) throw new RuntimeException("Véhicule non trouvé: " + id);
            vehicleRepository.deleteById(id);
            VehicleResponseDto dto = new VehicleResponseDto();
            dto.setId_vehicule(id);
            vehicleProducer.sendVehicleEvent("VEHICLE_DELETED", dto);
            telemetry.getVehiclesDeletedCounter().add(1);
        } finally {
            recordDuration("delete", startTime);
        }
    }

    private void recordDuration(String operation, long startTime) {
        long duration = System.currentTimeMillis() - startTime;
        telemetry.getOperationDurationHistogram().record(duration,
                Attributes.of(AttributeKey.stringKey("operation"), operation));
    }

    private void enrichLogsWithTraceContext() {
        Span currentSpan = Span.current();
        if (currentSpan != null && currentSpan.getSpanContext().isValid()) {
            MDC.put("traceId", currentSpan.getSpanContext().getTraceId());
            MDC.put("spanId", currentSpan.getSpanContext().getSpanId());
        }
    }

    private Vehicle mapToEntity(VehicleRequestDto dto) {
        Vehicle vehicle = new Vehicle();
        vehicle.setMarque(dto.getMarque());
        vehicle.setModele(dto.getModele());
        vehicle.setImmatriculation(dto.getImmatriculation());
        vehicle.setType(dto.getType());
        vehicle.setAnnee(dto.getAnnee());
        if (dto.getStatut() != null) vehicle.setStatut(VehicleStatus.valueOf(dto.getStatut().toUpperCase()));
        if (dto.getKilometrage() != null) vehicle.setKilometrage(dto.getKilometrage());
        return vehicle;
    }

    private VehicleResponseDto mapToDto(Vehicle vehicle) {
        VehicleResponseDto dto = new VehicleResponseDto();
        dto.setId_vehicule(vehicle.getId());
        dto.setMarque(vehicle.getMarque());
        dto.setModele(vehicle.getModele());
        dto.setImmatriculation(vehicle.getImmatriculation());
        dto.setStatut(vehicle.getStatut().name());
        dto.setKilometrage(vehicle.getKilometrage());
        dto.setType(vehicle.getType());
        dto.setAnnee(vehicle.getAnnee());
        dto.setCreatedAt(vehicle.getCreatedAt());
        dto.setUpdatedAt(vehicle.getUpdatedAt());
        return dto;
    }
}
