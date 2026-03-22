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
import static org.mockito.ArgumentMatchers.eq;
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
    private UUID vehicleId2;

    @BeforeEach
    void setUp() {
        vehicleId = UUID.randomUUID();
        vehicleId2 = UUID.randomUUID();

        responseDto = new VehicleResponseDto();
        responseDto.setId(vehicleId);
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

        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(vehicleId.toString()))
                .andExpect(jsonPath("$.marque").value("Renault"))
                .andExpect(jsonPath("$.modele").value("Clio"))
                .andExpect(jsonPath("$.immatriculation").value("AB-123-CD"));
    }

    @Test
    void getAllVehicles_ReturnsList() throws Exception {
        VehicleResponseDto responseDto2 = new VehicleResponseDto();
        responseDto2.setId(vehicleId2);
        responseDto2.setMarque("Peugeot");
        responseDto2.setModele("308");
        responseDto2.setImmatriculation("EF-456-GH");
        responseDto2.setStatut("EN_COURSE");
        responseDto2.setType("Berline");

        when(vehicleService.getAllVehicles()).thenReturn(Arrays.asList(responseDto, responseDto2));

        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].marque").value("Renault"))
                .andExpect(jsonPath("$[1].marque").value("Peugeot"));
    }

    @Test
    void getVehicleById_ReturnsVehicle() throws Exception {
        when(vehicleService.getVehicleById(vehicleId)).thenReturn(responseDto);

        mockMvc.perform(get("/api/vehicles/" + vehicleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(vehicleId.toString()))
                .andExpect(jsonPath("$.marque").value("Renault"));
    }

    @Test
    void updateVehicle_ReturnsUpdated() throws Exception {
        responseDto.setModele("Megane");
        when(vehicleService.updateVehicle(eq(vehicleId), any(VehicleRequestDto.class))).thenReturn(responseDto);

        requestDto.setModele("Megane");
        mockMvc.perform(put("/api/vehicles/" + vehicleId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modele").value("Megane"));
    }

    @Test
    void deleteVehicle_ReturnsNoContent() throws Exception {
        doNothing().when(vehicleService).deleteVehicle(vehicleId);

        mockMvc.perform(delete("/api/vehicles/" + vehicleId))
                .andExpect(status().isNoContent());
    }

    @Test
    void createVehicle_ValidationError_ReturnsBadRequest() throws Exception {
        VehicleRequestDto invalidRequest = new VehicleRequestDto();
        // Tous les champs obligatoires sont null

        mockMvc.perform(post("/api/vehicles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }
}
