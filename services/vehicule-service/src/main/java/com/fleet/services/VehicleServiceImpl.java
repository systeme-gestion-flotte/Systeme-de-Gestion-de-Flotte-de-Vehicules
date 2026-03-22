package com.fleet.services;

import com.fleet.dto.VehicleRequestDto;
import com.fleet.dto.VehicleResponseDto;
import com.fleet.entity.Vehicle;
import com.fleet.entity.Vehicle.VehicleStatus;
import com.fleet.kafka.VehicleProducer;
import com.fleet.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class VehicleServiceImpl implements VehicleService {

    private static final Logger log = LoggerFactory.getLogger(VehicleServiceImpl.class);

    private final VehicleRepository vehicleRepository;
    private final VehicleProducer vehicleProducer;

    public VehicleServiceImpl(VehicleRepository vehicleRepository, VehicleProducer vehicleProducer) {
        this.vehicleRepository = vehicleRepository;
        this.vehicleProducer = vehicleProducer;
    }

    @Override
    public VehicleResponseDto createVehicle(VehicleRequestDto request) {
        log.info("Création d'un véhicule: {} {}", request.getMarque(), request.getModele());

        if (vehicleRepository.existsByImmatriculation(request.getImmatriculation())) {
            throw new IllegalArgumentException("Un véhicule avec l'immatriculation " + request.getImmatriculation() + " existe déjà");
        }

        Vehicle vehicle = mapToEntity(request);
        Vehicle saved = vehicleRepository.save(vehicle);

        // Publier l'événement Kafka
        vehicleProducer.sendVehicleEvent("VEHICLE_CREATED", mapToDto(saved));

        log.info("Véhicule créé avec l'ID: {}", saved.getId());
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleResponseDto getVehicleById(UUID id) {
        log.info("Recherche du véhicule ID: {}", id);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Véhicule non trouvé avec l'ID: " + id));
        return mapToDto(vehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponseDto> getAllVehicles() {
        log.info("Récupération de tous les véhicules");
        return vehicleRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponseDto> getVehiclesByStatut(String statut) {
        log.info("Recherche des véhicules par statut: {}", statut);
        VehicleStatus status = VehicleStatus.valueOf(statut.toUpperCase());
        return vehicleRepository.findByStatut(status)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public VehicleResponseDto updateVehicle(UUID id, VehicleRequestDto request) {
        log.info("Mise à jour du véhicule ID: {}", id);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Véhicule non trouvé avec l'ID: " + id));

        vehicle.setMarque(request.getMarque());
        vehicle.setModele(request.getModele());
        vehicle.setImmatriculation(request.getImmatriculation());
        vehicle.setType(request.getType());
        vehicle.setAnnee(request.getAnnee());

        if (request.getStatut() != null) {
            vehicle.setStatut(VehicleStatus.valueOf(request.getStatut().toUpperCase()));
        }
        if (request.getKilometrage() != null) {
            vehicle.setKilometrage(request.getKilometrage());
        }

        Vehicle updated = vehicleRepository.save(vehicle);

        // Publier l'événement Kafka
        vehicleProducer.sendVehicleEvent("VEHICLE_UPDATED", mapToDto(updated));

        log.info("Véhicule mis à jour: {}", updated.getId());
        return mapToDto(updated);
    }

    @Override
    public void deleteVehicle(UUID id) {
        log.info("Suppression du véhicule ID: {}", id);
        if (!vehicleRepository.existsById(id)) {
            throw new RuntimeException("Véhicule non trouvé avec l'ID: " + id);
        }
        vehicleRepository.deleteById(id);

        // Publier l'événement Kafka
        VehicleResponseDto dto = new VehicleResponseDto();
        dto.setId(id);
        vehicleProducer.sendVehicleEvent("VEHICLE_DELETED", dto);

        log.info("Véhicule supprimé: {}", id);
    }

    // --- Mappers ---

    private Vehicle mapToEntity(VehicleRequestDto dto) {
        Vehicle vehicle = new Vehicle();
        vehicle.setMarque(dto.getMarque());
        vehicle.setModele(dto.getModele());
        vehicle.setImmatriculation(dto.getImmatriculation());
        vehicle.setType(dto.getType());
        vehicle.setAnnee(dto.getAnnee());
        if (dto.getStatut() != null) {
            vehicle.setStatut(VehicleStatus.valueOf(dto.getStatut().toUpperCase()));
        }
        if (dto.getKilometrage() != null) {
            vehicle.setKilometrage(dto.getKilometrage());
        }
        return vehicle;
    }

    private VehicleResponseDto mapToDto(Vehicle vehicle) {
        VehicleResponseDto dto = new VehicleResponseDto();
        dto.setId(vehicle.getId());
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
