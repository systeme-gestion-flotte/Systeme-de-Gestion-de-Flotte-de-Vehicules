# Guide Utilisateur : Système de Gestion de Flotte

Bienvenue dans l'interface de gestion de flotte ! Ce manuel détaille l'utilisation opérationnelle de l'application web Frontend.

*(Note : Les encarts de type `[Insérer la capture d'écran...]` sont intentionnels, vous pouvez les remplacer par de véritables captures après avoir testé les scénarios sur votre station environnée).*

## 1. Connexion et Rôles (Single Sign-On)

La plateforme utilise Keycloak pour sécuriser l'authentification et définir vos droits (RBAC). Les fonctionnalités proposées s'adapteront selon votre niveau d'accréditation.

1. Rendez-vous sur l'adresse d'accueil : `http://localhost:5173`.
2. Le système vous redirigera automatiquement vers le portail global et sécurisé.
3. Renseignez l'identifiant et le mot de passe accordé à votre profil (cf. annexe).
    *Exemple : Compte management `manager-fleet` (mdp : `manager1234!`)*
4. Cliquez sur **Log In**. Vous serez redirigé vers le tableau de bord de l'application.

> `[Insérer la capture d'écran : La page de login Keycloak avec le formulaire d'identification ici]`

## 2. Naviguer dans l'Application

La navigation principale s'effectue via le volet gauche (Sidebar). Elle affiche des onglets interactifs correspondant aux microservices mis à disposition :
- **Dashboard Global** : Vue unifiée avec KPIs (total des effectifs de la flotte et des conducteurs actifs).
- **Gestion des Véhicules** : Interface de contrôle de l'inventaire matériel.
- **Conducteurs** : Menu d'opérations métiers pour la création des conducteurs.
- **Localisation** : Visualisation GPS type carte interactive des trajets de flotte actuels.
- **Maintenance** : Suivi rigoureux des interventions planifiées et passées pour le parc mécanique.
- **Alertes** : Flux d'informations système et anomalies recensées.

> `[Insérer la capture d'écran : Le volet de navigation latéral (sidebar) où les différents menus sont visibles ici]`

## 3. Cas Pratique : Gestion des Véhicules

### Afficher et Filtrer le parc
En naviguant dans l'onglet **Gestion des Véhicules**, vous obtenez une grille complète listant l'inventaire matériel de la flotte.

- **Filtres de statut rapides** : Cliquez sur les puces d'états localisées en haut du tableau (`Tous`, `DISPONIBLE`, `EN COURSE`, `EN MAINTENANCE`) pour segmenter précisément l'affichage des résultats du service.
- **Mises à jour rapides** : Les collaborateurs accrédités (`manager` et `admin`) ont accès à une liste déroulante interactive pour muter le statut de disponibilité d'un véhicule immédiatement, ou le bouton Modifier en bout de ligne.

> `[Insérer la capture d'écran : La grille liste complète des véhicules affichant le filtre "Tous" ici]`

### Ajouter un nouveau Véhicule (Manager et Admin)
Si la société fait l'acquisition de nouveau matériel :
1. Cliquez sur l'appel d'action "Nouveau véhicule" positionné stratégiquement en haut à droite.
2. Un formulaire modal s'ouvre, vous y saisissez les données techniques requises :
   - Immatriculation
   - Marque et Modèle
   - Type (Utilitaire, Berline, etc.)
   - Année de production
3. Cliquez sur "Créer" pour valider la pérennité l'enregistrement.

> `[Insérer la capture d'écran : La fenêtre modal proposant le formulaire d'ajout avec ses champs dédiés ici]`

## 4. Notifications et Ergonomie Globale

De manière omniprésente dans l'application, lorsque vous agissez sur le système (ajout de véhicule, assignation d'une course, validation de tâche), une notification flash (Toast) glisse depuis le coin inférieur de l'écran pour indiquer que l'événement serveur est enregistré (ou l'erreur occasionnée).

> `[Insérer la capture d'écran : En bas à droite un exemple de bulle d'alarme de Toast confirmant une action succès ici]`

---

*(Pour toute restriction imprévue ou page affichant le message "Impossible de charger", cela indique généralement une inaccessibilité des passerelles de microservices. Procédez alors à une requête vers un administrateur Cloud).*
