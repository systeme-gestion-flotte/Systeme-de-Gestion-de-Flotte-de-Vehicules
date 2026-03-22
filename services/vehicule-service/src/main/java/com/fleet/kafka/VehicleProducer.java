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
            String key = eventType + "-" + vehicle.getId();
            String payload = objectMapper.writeValueAsString(new VehicleEvent(eventType, vehicle));

            kafkaTemplate.send(vehicleEventsTopic, key, payload);
            log.info("Événement Kafka envoyé: type={}, vehicleId={}", eventType, vehicle.getId());
        } catch (JsonProcessingException e) {
            log.error("Erreur de sérialisation de l'événement Kafka", e);
        }
    }

    // Classe interne pour l'événement
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
}
