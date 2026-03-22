package com.fleet.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class VehicleRequestDto {

    @NotBlank(message = "La marque est obligatoire")
    private String marque;

    @NotBlank(message = "Le modèle est obligatoire")
    private String modele;

    @NotBlank(message = "L'immatriculation est obligatoire")
    private String immatriculation;

    @NotBlank(message = "Le type est obligatoire")
    private String type;

    @NotNull(message = "L'année est obligatoire")
    private Short annee;

    private String statut;

    @Min(value = 0, message = "Le kilométrage doit être positif")
    private Integer kilometrage;

    // Constructeurs
    public VehicleRequestDto() {}

    public VehicleRequestDto(String marque, String modele, String immatriculation, String type, Short annee) {
        this.marque = marque;
        this.modele = modele;
        this.immatriculation = immatriculation;
        this.type = type;
        this.annee = annee;
    }

    // Getters et Setters
    public String getMarque() { return marque; }
    public void setMarque(String marque) { this.marque = marque; }

    public String getModele() { return modele; }
    public void setModele(String modele) { this.modele = modele; }

    public String getImmatriculation() { return immatriculation; }
    public void setImmatriculation(String immatriculation) { this.immatriculation = immatriculation; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Short getAnnee() { return annee; }
    public void setAnnee(Short annee) { this.annee = annee; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public Integer getKilometrage() { return kilometrage; }
    public void setKilometrage(Integer kilometrage) { this.kilometrage = kilometrage; }
}
