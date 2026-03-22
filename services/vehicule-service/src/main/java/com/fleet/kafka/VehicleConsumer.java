package com.fleet.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class VehicleConsumer {

    private static final Logger log = LoggerFactory.getLogger(VehicleConsumer.class);

    @KafkaListener(topics = "${app.kafka.topic.vehicle-events:vehicle-events}", groupId = "${spring.kafka.consumer.group-id:vehicule-service-group}")
    public void consumeVehicleEvent(String message) {
        log.info("Événement véhicule reçu: {}", message);
        // Traitement de l'événement (notifications, mises à jour, etc.)
    }
}
