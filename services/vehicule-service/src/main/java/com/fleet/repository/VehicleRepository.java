package com.fleet.repository;

import com.fleet.entity.Vehicle;
import com.fleet.entity.Vehicle.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    Optional<Vehicle> findByImmatriculation(String immatriculation);

    List<Vehicle> findByStatut(VehicleStatus statut);

    List<Vehicle> findByMarque(String marque);

    List<Vehicle> findByType(String type);

    boolean existsByImmatriculation(String immatriculation);
}
