package com.fleet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class VehiculeApplication {

    public static void main(String[] args) {
        SpringApplication.run(VehiculeApplication.class, args);
    }

    @GetMapping("/")
    public String home() {
        return "Service Vehicules en ligne !";
    }
}