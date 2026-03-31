package com.fleet.kafka;

import com.fleet.dto.VehicleResponseDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class VehicleProducer {

    private static final Logger log = LoggerFactory.getLogger(VehicleProducer.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topic.vehicle-events:vehicle-events}")
    private String vehicleEventsTopic;

    public VehicleProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    public void sendVehicleEvent(String eventType, VehicleResponseDto vehicle) {
        try {
            String key = eventType + "-" + vehicle.getId_vehicule();
            String payload = objectMapper.writeValueAsString(new VehicleEvent(eventType, vehicle));

            kafkaTemplate.send(vehicleEventsTopic, key, payload);
            log.info("Événement Kafka envoyé: {} [id={}]", eventType, vehicle.getId_vehicule());
        } catch (JsonProcessingException e) {
            log.error("Erreur lors de la sérialisation de l'événement Kafka", e);
        }
    }

    public void sendAssignationResponse(String eventType, String assignationId, String vehiculeId, String conducteurId, String raison) {
        try {
            String timestamp = java.time.Instant.now().toString();
            AssignationResponseEvent event = new AssignationResponseEvent(
                eventType, assignationId, vehiculeId, conducteurId, raison, timestamp
            );
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(vehicleEventsTopic, assignationId, payload);
            log.info("Événement réponse d'assignation envoyé: {} [assignId={}]", eventType, assignationId);
        } catch (JsonProcessingException e) {
            log.error("Erreur de sérialisation pour la réponse d'assignation", e);
        }
    }

    // Classe interne pour l'événement standard
    public static class VehicleEvent {
        private String eventType;
        private VehicleResponseDto vehicle;
        private long timestamp;

        public VehicleEvent() {}

        public VehicleEvent(String eventType, VehicleResponseDto vehicle) {
            this.eventType = eventType;
            this.vehicle = vehicle;
            this.timestamp = System.currentTimeMillis();
        }

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }

        public VehicleResponseDto getVehicle() { return vehicle; }
        public void setVehicle(VehicleResponseDto vehicle) { this.vehicle = vehicle; }

        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    }

    // Classe interne pour l'événement d'assignation attendu par conducteur-service
    public static class AssignationResponseEvent {
        private String eventType;
        private String assignationId;
        private String vehiculeId;
        private String conducteurId;
        private String raison;
        private String timestamp;

        public AssignationResponseEvent() {}

        public AssignationResponseEvent(String eventType, String assignationId, String vehiculeId, String conducteurId, String raison, String timestamp) {
            this.eventType = eventType;
            this.assignationId = assignationId;
            this.vehiculeId = vehiculeId;
            this.conducteurId = conducteurId;
            this.raison = raison;
            this.timestamp = timestamp;
        }

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }

        public String getAssignationId() { return assignationId; }
        public void setAssignationId(String assignationId) { this.assignationId = assignationId; }

        public String getVehiculeId() { return vehiculeId; }
        public void setVehiculeId(String vehiculeId) { this.vehiculeId = vehiculeId; }

        public String getConducteurId() { return conducteurId; }
        public void setConducteurId(String conducteurId) { this.conducteurId = conducteurId; }

        public String getRaison() { return raison; }
        public void setRaison(String raison) { this.raison = raison; }

        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }
}
