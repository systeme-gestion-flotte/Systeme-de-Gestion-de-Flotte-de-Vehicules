package com.fleet.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fleet.entity.Vehicle;
import com.fleet.entity.Vehicle.VehicleStatus;
import com.fleet.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class VehicleConsumer {

    private static final Logger log = LoggerFactory.getLogger(VehicleConsumer.class);

    private final VehicleRepository vehicleRepository;
    private final VehicleProducer vehicleProducer;
    private final ObjectMapper objectMapper;

    public VehicleConsumer(VehicleRepository vehicleRepository, VehicleProducer vehicleProducer) {
        this.vehicleRepository = vehicleRepository;
        this.vehicleProducer = vehicleProducer;
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(topics = {
        "${app.kafka.topic.vehicle-events:vehicle-events}", 
        "${app.kafka.topic.assignation-events:fleet.conducteurs.assignation}"
    }, groupId = "${spring.kafka.consumer.group-id:vehicule-service-group}")
    public void consumeVehicleEvent(String message) {
        log.info("Événement véhicule reçu: {}", message);
        try {
            JsonNode root = objectMapper.readTree(message);
            if (root.has("eventType") && "AssignationDemandee".equals(root.get("eventType").asText())) {
                handleAssignationDemandee(root);
            }
        } catch (Exception e) {
            log.error("Erreur de parsing de l'événement Kafka: {}", message, e);
        }
    }

    private void handleAssignationDemandee(JsonNode root) {
        String assignationId = root.path("assignationId").asText();
        String vehiculeIdStr = root.path("vehiculeId").asText();
        String conducteurId = root.path("conducteurId").asText();
        
        try {
            UUID vehiculeId = UUID.fromString(vehiculeIdStr);
            Optional<Vehicle> vehiculeOpt = vehicleRepository.findById(vehiculeId);
            
            if (vehiculeOpt.isEmpty()) {
                log.warn("Véhicule {} non trouvé pour assignation {}", vehiculeId, assignationId);
                vehicleProducer.sendAssignationResponse(
                    "EchecAssignationVehicule", assignationId, vehiculeIdStr, conducteurId, "Véhicule introuvable"
                );
                return;
            }
            
            Vehicle vehicule = vehiculeOpt.get();
            if (vehicule.getStatut() != VehicleStatus.DISPONIBLE) {
                log.warn("Véhicule {} n'est pas DISPONIBLE (Statut actuel: {})", vehiculeId, vehicule.getStatut());
                vehicleProducer.sendAssignationResponse(
                    "EchecAssignationVehicule", assignationId, vehiculeIdStr, conducteurId, "Véhicule non disponible"
                );
                return;
            }
            
            // Mettre à jour le statut
            vehicule.setStatut(VehicleStatus.EN_COURSE);
            vehicleRepository.save(vehicule);
            
            log.info("Véhicule {} assigné avec succès pour l'assignation {}", vehiculeId, assignationId);
            vehicleProducer.sendAssignationResponse(
                "VehiculeAssigneAvecSucces", assignationId, vehiculeIdStr, conducteurId, null
            );
            
        } catch (IllegalArgumentException e) {
            log.error("UUID invalide pour vehiculeId: {}", vehiculeIdStr);
        }
    }
}
