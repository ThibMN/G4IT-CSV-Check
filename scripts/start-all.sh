#!/bin/bash

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Définir le répertoire de base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"

echo -e "${BLUE}Démarrage de G4IT CSV Check...${NC}"
echo -e "${BLUE}Répertoire de base: $BASE_DIR${NC}"

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python3 n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Fonction pour démarrer le backend
start_backend() {
    echo -e "${BLUE}Démarrage du backend...${NC}"
    cd "$BACKEND_DIR" || exit 1

    # Créer et activer l'environnement virtuel si nécessaire
    if [ ! -d "venv" ]; then
        echo -e "${BLUE}Création de l'environnement virtuel...${NC}"
        python3 -m venv venv
    fi

    # Activer l'environnement virtuel
    source venv/bin/activate || source venv/Scripts/activate

    # Installer les dépendances
    echo -e "${BLUE}Installation des dépendances du backend...${NC}"
    pip install -r requirements.txt

    # Démarrer le serveur backend en arrière-plan avec uvicorn sur le port 8001
    echo -e "${GREEN}Démarrage du serveur FastAPI sur le port 8001...${NC}"
    python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 &
    BACKEND_PID=$!
    echo -e "${GREEN}Backend démarré avec PID: $BACKEND_PID${NC}"
}

# Fonction pour démarrer le frontend
start_frontend() {
    echo -e "${BLUE}Démarrage du frontend...${NC}"
    cd "$FRONTEND_DIR" || exit 1

    # Installer les dépendances si le répertoire node_modules n'existe pas
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}Installation des dépendances du frontend...${NC}"
        npm install
    fi

    # Démarrer le serveur de développement Next.js
    echo -e "${GREEN}Démarrage du serveur Next.js...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    echo -e "${GREEN}Frontend démarré avec PID: $FRONTEND_PID${NC}"
}

# Fonction pour arrêter proprement les processus
cleanup() {
    echo -e "${BLUE}Arrêt des serveurs...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        echo -e "${BLUE}Arrêt du backend (PID: $BACKEND_PID)...${NC}"
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        echo -e "${BLUE}Arrêt du frontend (PID: $FRONTEND_PID)...${NC}"
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    fi
    echo -e "${GREEN}Serveurs arrêtés.${NC}"
    exit 0
}

# Capture des signaux pour arrêter proprement les processus
trap cleanup SIGINT SIGTERM

# Démarrer les serveurs
start_backend
start_frontend

echo -e "${GREEN}====================${NC}"
echo -e "${GREEN}Serveurs démarrés!${NC}"
echo -e "${GREEN}Frontend: http://localhost:3001${NC}"
echo -e "${GREEN}Backend: http://127.0.0.1:8001${NC}"
echo -e "${GREEN}====================${NC}"
echo -e "${BLUE}Appuyez sur Ctrl+C pour arrêter les serveurs${NC}"

# Attendre indéfiniment (jusqu'à ce que Ctrl+C soit pressé)
wait
