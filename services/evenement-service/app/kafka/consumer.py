import os
import json
import asyncio
from confluent_kafka import Consumer, KafkaError
from app.database.database import SessionLocal
from app.services import crud
from app.schemas import schemas
from app.core.config import settings

def process_message(msg):
    topic = msg.topic()
    try:
        value = msg.value().decode('utf-8')
        data = json.loads(value)
        db = SessionLocal()
        
        def add_alert(role, severite, titre_template, msg_template, user_id=None):
            try:
                try:
                    titre = titre_template.format(**data)
                except KeyError:
                    titre = titre_template
                try:
                    message = msg_template.format(**data)
                except KeyError:
                    message = msg_template
                
                alert = schemas.AlerteCreate(
                    type="info", # Champ historique
                    source=data.get("immatriculation") or data.get("vehicule_id") or "Flotte",
                    message=f"{titre} - {message}",
                    time="À l'instant",
                    role_cible=role,
                    user_id_cible=user_id,
                    source_topic=topic,
                    severite=severite
                )
                crud.create_alert(db, alert)
            except Exception as e:
                print(f"[Evenement Consumer] Erreur création alerte pour {role}: {e}")

        # --- LOCALISATION ---
        if topic == "fleet.localisation.geofence.sortie":
            g_type = data.get("type")
            zone = data.get("zone_nom", "Inconnue")
            cond_id = data.get("conducteur_id")
            if g_type == "sortie_zone_autorisee":
                add_alert("admin", "critique", "Sortie de zone autorisée", "Véhicule {immatriculation} a quitté la zone {zone_nom}.")
                add_alert("manager", "critique", "Sortie de zone autorisée", "Véhicule {immatriculation} a quitté la zone {zone_nom}.")
                add_alert("conducteur", "critique", "Vous avez quitté la zone autorisée", "Votre véhicule a quitté la zone {zone_nom}. Revenez dans la zone.", user_id=cond_id)
            elif g_type == "entree_zone_interdite":
                add_alert("admin", "critique", "Entrée en zone interdite", "Véhicule {immatriculation} est entré dans la zone interdite {zone_nom}.")
                add_alert("manager", "critique", "Entrée en zone interdite", "Véhicule {immatriculation} est entré dans la zone interdite {zone_nom}.")
                add_alert("conducteur", "critique", "Zone interdite — faites demi-tour", "Vous êtes entré dans une zone interdite : {zone_nom}.", user_id=cond_id)

        elif topic == "fleet.localisation.immobile":
            add_alert("manager", "attention", "Véhicule immobile", "Le véhicule {immatriculation} est immobile depuis {duree_minutes} minutes.")
            add_alert("conducteur", "attention", "Véhicule immobile détecté", "Votre véhicule {immatriculation} est signalé immobile depuis {duree_minutes} min.", user_id=data.get("conducteur_id"))

        elif topic == "fleet.localisation.vitesse":
            add_alert("admin", "critique", "Excès de vitesse", "Véhicule {immatriculation} : {vitesse_kmh} km/h (limite {limite_kmh} km/h).")
            add_alert("manager", "critique", "Excès de vitesse", "Véhicule {immatriculation} : {vitesse_kmh} km/h (limite {limite_kmh} km/h).")
            add_alert("conducteur", "critique", "Excès de vitesse détecté", "Attention : vous roulez à {vitesse_kmh} km/h, limite {limite_kmh} km/h.", user_id=data.get("conducteur_id"))

        elif topic == "fleet.localisation.signal_perdu":
            add_alert("manager", "attention", "Signal GPS perdu", "Le véhicule {immatriculation} n'est plus localisé.")
            add_alert("technicien", "attention", "Signal GPS perdu", "Le véhicule {immatriculation} n'est plus localisé (vérifier boîtier).")

        elif topic == "fleet.localisation.signal_retrouve":
            add_alert("manager", "info", "Signal GPS retrouvé", "Le véhicule {immatriculation} est à nouveau localisé.")
            add_alert("technicien", "info", "Signal GPS retrouvé", "Le véhicule {immatriculation} est à nouveau localisé.")

        elif topic == "fleet.localisation.trajet_non_planifie":
            add_alert("admin", "attention", "Trajet non planifié", "Véhicule {immatriculation} effectue un trajet hors planning.")
            add_alert("manager", "attention", "Trajet non planifié", "Véhicule {immatriculation} effectue un trajet hors planning.")

        # --- MAINTENANCE ---
        elif topic == "fleet.maintenance.planifiee":
            add_alert("manager", "info", "Maintenance planifiée", "Véhicule {immatriculation} : maintenance planifiée.")
            add_alert("technicien", "attention", "Nouvelle intervention assignée", "Intervention planifiée sur le véhicule {immatriculation}.", user_id=data.get("technicien_id"))

        elif topic == "fleet.maintenance.en_cours":
            add_alert("manager", "info", "Maintenance démarrée", "Véhicule {immatriculation} : intervention en cours.")
            add_alert("conducteur", "info", "Votre véhicule est en maintenance", "Le véhicule {immatriculation} est en cours d'intervention.", user_id=data.get("conducteur_id"))

        elif topic == "fleet.maintenance.terminee":
            add_alert("manager", "info", "Maintenance terminée", "Le véhicule {immatriculation} n'est plus en maintenance.")
            add_alert("conducteur", "info", "Votre véhicule est disponible", "Le véhicule {immatriculation} est à nouveau disponible.", user_id=data.get("conducteur_id"))

        elif topic == "fleet.maintenance.retard":
            add_alert("admin", "attention", "Maintenance en retard", "Véhicule {immatriculation} : maintenance prévue le {date_prevue} ({retard_jours}j de retard).")
            add_alert("manager", "attention", "Maintenance en retard", "Véhicule {immatriculation} : maintenance prévue le {date_prevue} ({retard_jours}j de retard).")

        elif topic == "fleet.maintenance.rappel":
            add_alert("manager", "attention", "Maintenance à planifier", "Véhicule {immatriculation} : maintenance dans {jours_restants} jours.")
            add_alert("technicien", "attention", "Rappel intervention", "Intervention sur {immatriculation} dans {jours_restants} jours.", user_id=data.get("technicien_id"))

        elif topic == "fleet.maintenance.piece_manquante":
            add_alert("admin", "attention", "Pièce manquante", "Véhicule {immatriculation} : pièce '{piece_nom}' indisponible.")
            add_alert("manager", "attention", "Pièce manquante", "Véhicule {immatriculation} : pièce '{piece_nom}' indisponible.")

        elif topic == "fleet.maintenance.annulee":
            add_alert("manager", "attention", "Maintenance annulée", "Maintenance annulée pour {immatriculation}. Raison : {raison}.")
            add_alert("technicien", "attention", "Votre intervention est annulée", "L'intervention sur {immatriculation} a été annulée. Raison : {raison}.", user_id=data.get("technicien_id"))

        # --- VÉHICULES ---
        elif topic == "vehicle-events":
            action = data.get("action") or data.get("eventType")
            if action in ["VEHICLE_CREATED", "CREATED"]:
                add_alert("admin", "info", "Nouveau véhicule enregistré", "Le véhicule {immatriculation} ({marque} {modele}) a été ajouté.")
            elif action in ["VEHICLE_UPDATED", "UPDATED"]:
                add_alert("admin", "info", "Véhicule modifié", "Le véhicule {immatriculation} a été mis à jour.")
                add_alert("manager", "info", "Véhicule modifié", "Le véhicule {immatriculation} a été mis à jour.")
            elif action == "VEHICLE_DISABLED":
                add_alert("admin", "attention", "Véhicule mis hors service", "Le véhicule {immatriculation} est maintenant hors service.")
                add_alert("manager", "attention", "Véhicule mis hors service", "Le véhicule {immatriculation} est maintenant hors service.")
                add_alert("conducteur", "attention", "Votre véhicule est hors service", "Le véhicule {immatriculation} qui vous est assigné est hors service.", user_id=data.get("conducteur_id"))
            elif action == "VEHICLE_DELETED":
                add_alert("admin", "attention", "Véhicule supprimé", "Le véhicule {immatriculation} a été supprimé du système.")
                add_alert("manager", "attention", "Véhicule supprimé", "Le véhicule {immatriculation} a été supprimé du système.")
            elif action == "VEHICLE_KM_THRESHOLD":
                add_alert("admin", "attention", "Kilométrage seuil atteint", "Véhicule {immatriculation} : {kilometrage_actuel} km (seuil {seuil_km} km).")
                add_alert("manager", "attention", "Kilométrage seuil atteint", "Véhicule {immatriculation} : {kilometrage_actuel} km (seuil {seuil_km} km).")

        # --- CONDUCTEURS ---
        elif topic == "fleet.conducteurs.assignation":
            action = data.get("action", "assignation")
            if action == "assignation":
                add_alert("manager", "info", "Assignation conducteur", "Conducteur ID {conducteur_id} assigné au véhicule {immatriculation}.")
                add_alert("conducteur", "info", "Vous avez été assigné à un véhicule", "Vous êtes maintenant assigné au véhicule {immatriculation}.", user_id=data.get("conducteur_id"))
            elif action == "annulation":
                add_alert("manager", "attention", "Assignation annulée", "Le conducteur ID {conducteur_id} n'est plus assigné à {immatriculation}.")
                add_alert("conducteur", "attention", "Assignation annulée", "Vous n'êtes plus assigné au véhicule {immatriculation}.", user_id=data.get("conducteur_id"))

        elif topic == "fleet.conducteurs.signalement":
            add_alert("admin", "attention", "Signalement conducteur", "{conducteur_nom} signale sur {immatriculation} : {message}")
            add_alert("manager", "attention", "Signalement conducteur", "{conducteur_nom} signale sur {immatriculation} : {message}")

        elif topic == "fleet.conducteurs.permis_expiration":
            add_alert("admin", "critique", "Permis expiré ou proche expiration", "Permis de {conducteur_nom} expire le {date_expiration} ({jours_restants}j restants).")
            add_alert("manager", "critique", "Permis expiré ou proche expiration", "Permis de {conducteur_nom} expire le {date_expiration} ({jours_restants}j restants).")
            add_alert("conducteur", "critique", "Votre permis expire bientôt", "Votre permis de conduire expire le {date_expiration}. Renouvelez-le.", user_id=data.get("conducteur_id"))

        elif topic == "fleet.conducteurs.updated":
            add_alert("admin", "info", "Fiche conducteur mise à jour", "La fiche de {conducteur_nom} a été modifiée.")

        db.close()
    except Exception as e:
        print(f"Erreur de processing Kafka message sur {topic}: {e}")

async def start_consumer():
    if os.getenv("TESTING") == "True":
        print("Mock Consumer: Skipping Kafka logic.")
        return
        
    config = {
        'bootstrap.servers': settings.KAFKA_BROKER,
        'group.id': 'evenement-service-group',
        'auto.offset.reset': 'earliest'
    }
    
    try:
        consumer = Consumer(config)
        consumer.subscribe([
            "vehicle-events", 
            "fleet.maintenance.planifiee", 
            "fleet.maintenance.terminee",
            "fleet.conducteurs.assignation",
            "fleet.localisation.geofence.sortie",
            "fleet.localisation.immobile",
            "fleet.localisation.vitesse",
            "fleet.localisation.signal_perdu",
            "fleet.localisation.signal_retrouve",
            "fleet.localisation.trajet_non_planifie",
            "fleet.maintenance.en_cours",
            "fleet.maintenance.retard",
            "fleet.maintenance.rappel",
            "fleet.maintenance.piece_manquante",
            "fleet.maintenance.annulee",
            "fleet.conducteurs.signalement",
            "fleet.conducteurs.permis_expiration",
            "fleet.conducteurs.updated"
        ])
        print(f"[Evenement Consumer] Démarré et en écoute sur {len(consumer.list_topics().topics)} topics...")
        
        while True:
            await asyncio.sleep(0.1) 
            msg = consumer.poll(0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(f"Kafka erreur: {msg.error()}")
                    continue
            await asyncio.to_thread(process_message, msg)
            
    except Exception as e:
        print(f"[Evenement Consumer] Exception fatale: {e}")
    finally:
        try:
            consumer.close()
        except:
            pass
