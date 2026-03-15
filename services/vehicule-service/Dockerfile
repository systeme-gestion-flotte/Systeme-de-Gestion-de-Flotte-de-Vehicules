FROM maven:3.9-eclipse-temurin-17-alpine AS builder

# Définition du répertoire de travail
WORKDIR /app

# Copie uniquement le fichier pom.xml en premier
COPY pom.xml .

# Téléchargement des dépendances hors ligne (cela permet de mettre en cache 
# cette étape et d'accélérer les builds suivants si le pom.xml ne change pas)
RUN mvn dependency:go-offline

# Copie du reste du code source
COPY src ./src

# Compilation de l'application (création du fichier .jar) en ignorant les tests pour accélérer le build
RUN mvn clean package -DskipTests

# ==========================================
# Étape 2 : Production (Image finale allégée et sécurisée)
# ==========================================
# Utilisation d'une image JRE (Java Runtime Environment) beaucoup plus légère que le JDK
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Création d'un utilisateur et d'un groupe non-root nommés "spring" par mesure de sécurité
RUN addgroup -S spring && adduser -S spring -G spring

# Copie du fichier .jar généré lors de l'étape de build
# On renomme le fichier cible en "app.jar" pour plus de simplicité, et on donne les droits au nouvel utilisateur
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

# Bascule sur l'utilisateur sécurisé non-root
USER spring

# Exposition du port par défaut de Spring Boot
EXPOSE 8080

# Commande de démarrage de l'application Java
ENTRYPOINT ["java", "-jar", "app.jar"]