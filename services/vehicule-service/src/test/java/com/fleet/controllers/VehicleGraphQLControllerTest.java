package com.fleet.controllers;

import com.fleet.dto.VehicleResponseDto;
import com.fleet.services.VehicleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureGraphQlTester;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.test.context.ActiveProfiles;

import java.util.Arrays;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureGraphQlTester
@ActiveProfiles("test")
class VehicleGraphQLControllerTest {

    @Autowired
    private GraphQlTester graphQlTester;

    @MockBean
    private VehicleService vehicleService;

    private VehicleResponseDto responseDto;
    private UUID vehicleId;

    @BeforeEach
    void setUp() {
        vehicleId = UUID.randomUUID();
        responseDto = new VehicleResponseDto();
        responseDto.setId_vehicule(vehicleId);
        responseDto.setMarque("Renault");
        responseDto.setModele("Clio");
        responseDto.setImmatriculation("AB-123-CD");
        responseDto.setStatut("DISPONIBLE");
        responseDto.setKilometrage(50000);
        responseDto.setType("Berline");
        responseDto.setAnnee((short) 2020);
    }

    @Test
    void allVehicles_ReturnsList() {
        when(vehicleService.getAllVehicles()).thenReturn(Arrays.asList(responseDto));

        String query = "{ allVehicles { id marque immatriculation } }";

        graphQlTester.document(query)
                .execute()
                .path("allVehicles")
                .entityList(Object.class)
                .hasSize(1);
    }

    @Test
    void vehicleById_ReturnsVehicle() {
        when(vehicleService.getVehicleById(vehicleId)).thenReturn(responseDto);

        String query = "{ vehicleById(id: \"" + vehicleId + "\") { id marque } }";

        graphQlTester.document(query)
                .execute()
                .path("vehicleById.id")
                .entity(String.class)
                .isEqualTo(vehicleId.toString());
    }

    @Test
    void createVehicle_ReturnsCreated() {
        when(vehicleService.createVehicle(any())).thenReturn(responseDto);

        String mutation = "mutation { createVehicle(marque: \"Renault\", modele: \"Clio\", immatriculation: \"AB-123-CD\", type: \"Berline\", annee: 2020) { id marque } }";

        graphQlTester.document(mutation)
                .execute()
                .path("createVehicle.id")
                .entity(String.class)
                .isEqualTo(vehicleId.toString());
    }
}
