package com.fleet.kafka;

import com.fleet.dto.VehicleResponseDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class VehicleProducerTest {

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @InjectMocks
    private VehicleProducer vehicleProducer;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(vehicleProducer, "vehicleEventsTopic", "vehicle-events");
    }

    @Test
    void sendVehicleEvent_SendsToKafka() {
        VehicleResponseDto dto = new VehicleResponseDto();
        dto.setId_vehicule(UUID.randomUUID());
        dto.setMarque("Renault");

        vehicleProducer.sendVehicleEvent("VEHICLE_CREATED", dto);

        verify(kafkaTemplate).send(eq("vehicle-events"), anyString(), anyString());
    }
}
