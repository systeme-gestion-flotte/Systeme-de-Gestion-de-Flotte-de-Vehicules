package com.fleet.controllers;

import com.fleet.dto.VehicleRequestDto;
import com.fleet.dto.VehicleResponseDto;
import com.fleet.services.VehicleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

@Controller
public class VehicleGraphQLController {

    private static final Logger log = LoggerFactory.getLogger(VehicleGraphQLController.class);

    private final VehicleService vehicleService;

    public VehicleGraphQLController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    // --- Queries ---

    @QueryMapping
    public List<VehicleResponseDto> allVehicles() {
        log.info("GraphQL Query: allVehicles");
        return vehicleService.getAllVehicles();
    }

    @QueryMapping
    public VehicleResponseDto vehicleById(@Argument String id) {
        log.info("GraphQL Query: vehicleById({})", id);
        return vehicleService.getVehicleById(UUID.fromString(id));
    }

    @QueryMapping
    public List<VehicleResponseDto> vehiclesByStatut(@Argument String statut) {
        log.info("GraphQL Query: vehiclesByStatut({})", statut);
        return vehicleService.getVehiclesByStatut(statut);
    }

    // --- Mutations ---

    @MutationMapping
    public VehicleResponseDto createVehicle(@Argument String marque,
            @Argument String modele,
            @Argument String immatriculation,
            @Argument String type,
            @Argument String statut,
            @Argument Integer kilometrage,
            @Argument Integer annee) {
        log.info("GraphQL Mutation: createVehicle");
        VehicleRequestDto request = new VehicleRequestDto();
        request.setMarque(marque);
        request.setModele(modele);
        request.setImmatriculation(immatriculation);
        request.setType(type);
        request.setStatut(statut);
        request.setKilometrage(kilometrage);
        request.setAnnee(annee != null ? annee.shortValue() : null);
        return vehicleService.createVehicle(request);
    }

    @MutationMapping
    public VehicleResponseDto updateVehicle(@Argument String id,
            @Argument String marque,
            @Argument String modele,
            @Argument String immatriculation,
            @Argument String type,
            @Argument String statut,
            @Argument Integer kilometrage,
            @Argument Integer annee) {
        log.info("GraphQL Mutation: updateVehicle({})", id);
        VehicleRequestDto request = new VehicleRequestDto();
        request.setMarque(marque);
        request.setModele(modele);
        request.setImmatriculation(immatriculation);
        request.setType(type);
        request.setStatut(statut);
        request.setKilometrage(kilometrage);
        request.setAnnee(annee != null ? annee.shortValue() : null);
        return vehicleService.updateVehicle(UUID.fromString(id), request);
    }

    @MutationMapping
    public Boolean deleteVehicle(@Argument String id) {
        log.info("GraphQL Mutation: deleteVehicle({})", id);
        vehicleService.deleteVehicle(UUID.fromString(id));
        return true;
    }
}
