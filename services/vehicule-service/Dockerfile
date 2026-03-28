FROM maven:3.9-eclipse-temurin-17-alpine AS builder

# Définition du répertoire de travail
WORKDIR /app

# Copie uniquement le fichier pom.xml en premier
COPY pom.xml .

# Téléchargement des dépendances hors ligne
RUN mvn dependency:go-offline

# Copie du reste du code source
COPY src ./src

# Compilation de l'application en ignorant les tests pour accélérer le build
RUN mvn clean package -DskipTests

# Étape 2 : Production (Image finale allégée et sécurisée)
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

USER spring

EXPOSE 4000

ENTRYPOINT ["java", "-jar", "app.jar"]