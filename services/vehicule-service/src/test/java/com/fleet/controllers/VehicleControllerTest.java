package com.fleet.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fleet.dto.VehicleRequestDto;
import com.fleet.dto.VehicleResponseDto;
import com.fleet.services.VehicleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VehicleController.class)
class VehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VehicleService vehicleService;

    @Autowired
    private ObjectMapper objectMapper;

    private VehicleResponseDto responseDto;
    private VehicleRequestDto requestDto;
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
        responseDto.setCreatedAt(LocalDateTime.now());
        responseDto.setUpdatedAt(LocalDateTime.now());

        requestDto = new VehicleRequestDto("Renault", "Clio", "AB-123-CD", "Berline", (short) 2020);
        requestDto.setKilometrage(50000);
    }

    @Test
    void createVehicle_ReturnsCreated() throws Exception {
        when(vehicleService.createVehicle(any(VehicleRequestDto.class))).thenReturn(responseDto);

        mockMvc.perform(post("/api/vehicules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id_vehicule").value(vehicleId.toString()))
                .andExpect(jsonPath("$.marque").value("Renault"));
    }

    @Test
    void getAllVehicles_ReturnsList() throws Exception {
        when(vehicleService.getAllVehicles()).thenReturn(Arrays.asList(responseDto));

        mockMvc.perform(get("/api/vehicules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id_vehicule").value(vehicleId.toString()));
    }

    @Test
    void getVehicleById_ReturnsVehicle() throws Exception {
        when(vehicleService.getVehicleById(vehicleId)).thenReturn(responseDto);

        mockMvc.perform(get("/api/vehicules/" + vehicleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id_vehicule").value(vehicleId.toString()));
    }

    @Test
    void deleteVehicle_ReturnsNoContent() throws Exception {
        doNothing().when(vehicleService).deleteVehicle(vehicleId);

        mockMvc.perform(delete("/api/vehicules/" + vehicleId))
                .andExpect(status().isNoContent());
    }
}
