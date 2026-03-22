package com.fleet.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vehicule")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_vehicule")
    private UUID id;

    @Column(name = "immatriculation", nullable = false, unique = true, length = 20)
    private String immatriculation;

    @Column(nullable = false, length = 100)
    private String marque;

    @Column(nullable = false, length = 100)
    private String modele;

    @Column(name = "annee", nullable = false)
    private Short annee;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private VehicleStatus statut = VehicleStatus.DISPONIBLE;

    @Column(nullable = false)
    private Integer kilometrage = 0;

    @Column(nullable = false, length = 50)
    private String type; // SUV, berline, utilitaire, etc.

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum VehicleStatus {
        DISPONIBLE, EN_COURSE, EN_MAINTENANCE
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Constructeurs
    public Vehicle() {}

    public Vehicle(String marque, String modele, String immatriculation, String type, Short annee) {
        this.marque = marque;
        this.modele = modele;
        this.immatriculation = immatriculation;
        this.type = type;
        this.annee = annee;
    }

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getMarque() { return marque; }
    public void setMarque(String marque) { this.marque = marque; }

    public String getModele() { return modele; }
    public void setModele(String modele) { this.modele = modele; }

    public String getImmatriculation() { return immatriculation; }
    public void setImmatriculation(String immatriculation) { this.immatriculation = immatriculation; }

    public Short getAnnee() { return annee; }
    public void setAnnee(Short annee) { this.annee = annee; }

    public VehicleStatus getStatut() { return statut; }
    public void setStatut(VehicleStatus statut) { this.statut = statut; }

    public Integer getKilometrage() { return kilometrage; }
    public void setKilometrage(Integer kilometrage) { this.kilometrage = kilometrage; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
