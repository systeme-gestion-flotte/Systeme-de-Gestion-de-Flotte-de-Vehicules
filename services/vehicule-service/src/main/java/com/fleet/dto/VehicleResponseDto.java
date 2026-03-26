package com.fleet.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class VehicleResponseDto {

    private UUID id_vehicule;
    private String marque;
    private String modele;
    private String immatriculation;
    private String statut;
    private Integer kilometrage;
    private String type;
    private Short annee;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructeurs
    public VehicleResponseDto() {}

    // Getters et Setters
    public UUID getId_vehicule() { return id_vehicule; }
    public void setId_vehicule(UUID id_vehicule) { this.id_vehicule = id_vehicule; }

    // Alias pour GraphQL 'id'
    public UUID getId() { return id_vehicule; }

    public String getMarque() { return marque; }
    public void setMarque(String marque) { this.marque = marque; }

    public String getModele() { return modele; }
    public void setModele(String modele) { this.modele = modele; }

    public String getImmatriculation() { return immatriculation; }
    public void setImmatriculation(String immatriculation) { this.immatriculation = immatriculation; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public Integer getKilometrage() { return kilometrage; }
    public void setKilometrage(Integer kilometrage) { this.kilometrage = kilometrage; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Short getAnnee() { return annee; }
    public void setAnnee(Short annee) { this.annee = annee; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
