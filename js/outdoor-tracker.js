// outdoor-tracker.js - Rastreamento de atividades outdoor

class OutdoorTracker {
    constructor() {
        this.outdoorMap = null;
        this.outdoorStartTime = null;
        this.outdoorTimerInterval = null;
        this.outdoorWatchId = null;
        this.trackPoints = [];
        this.totalDistance = 0;
        this.lastPosition = null;
        this.currentOutdoorActivity = null;
    }

    // Inicializar tela outdoor
    initializeOutdoorScreen(database, currentStudentEmail) {
        if (this.outdoorMap) {
            this.outdoorMap.remove();
        }
        
        document.getElementById("outdoorTracker").classList.add("hidden");
        document.getElementById("outdoor-selection").classList.remove("hidden");
        
        // Inicializar mapa
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            this.outdoorMap = L.map("outdoorMap").setView([latitude, longitude], 15);
            
            L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }).addTo(this.outdoorMap);
            
            L.marker([latitude, longitude]).addTo(this.outdoorMap);
        }, () => {
            // Fallback para localização padrão
            this.outdoorMap = L.map("outdoorMap").setView([-22.919, -42.822], 13);
            L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(this.outdoorMap);
            alert("Não foi possível obter sua localização atual.");
        });
        
        this.updateOutdoorHistory(database, currentStudentEmail);
    }

    // Iniciar rastreamento outdoor
    startOutdoorTracking() {
        this.outdoorStartTime = Date.now();
        this.trackPoints = [];
        this.totalDistance = 0;
        this.lastPosition = null;
        
        document.getElementById("outdoorStartButton").disabled = true;
        document.getElementById("outdoorStopButton").disabled = false;
        
        // Timer para duração
        this.outdoorTimerInterval = setInterval(() => {
            const diff = Math.floor((Date.now() - this.outdoorStartTime) / 1000);
            const h = String(Math.floor(diff / 3600)).padStart(2, "0");
            const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
            const s = String(diff % 60).padStart(2, "0");
            document.getElementById("outdoorTime").textContent = `${h}:${m}:${s}`;
        }, 1000);
        
        // Rastreamento GPS
        this.outdoorWatchId = navigator.geolocation.watchPosition(
            position => {
                const { latitude, longitude, speed } = position.coords;
                const currentPosition = { lat: latitude, lng: longitude };
                
                // Calcular distância
                if (this.lastPosition) {
                    this.totalDistance += this.haversineDistance(this.lastPosition, currentPosition);
                }
                this.lastPosition = currentPosition;
                
                // Atualizar UI
                const distanceKm = (this.totalDistance / 1000).toFixed(2);
                const speedKmh = speed ? (3.6 * speed).toFixed(1) : "0.0";
                const pace = speed > 0.5 ? (60 / (3.6 * speed)).toFixed(2).replace(".", ":") : "--:--";
                
                document.getElementById("outdoorDistance").textContent = `${distanceKm} km`;
                document.getElementById("outdoorSpeed").textContent = `${speedKmh} km/h`;
                document.getElementById("outdoorPace").textContent = `${pace} /km`;
                
                // Atualizar mapa
                if (this.outdoorMap) {
                    this.outdoorMap.setView(currentPosition, 16);
                }
            },
            error => {
                alert("Erro no GPS: " + error.message);
            },
            { enableHighAccuracy: true }
        );
    }

    // Parar rastreamento outdoor
    stopOutdoorTracking(database, currentStudentEmail) {
        clearInterval(this.outdoorTimerInterval);
        navigator.geolocation.clearWatch(this.outdoorWatchId);
        
        const workout = {
            activity: this.currentOutdoorActivity,
            date: new Date().toISOString(),
            distance: document.getElementById("outdoorDistance").textContent.replace(" km", ""),
            duration: document.getElementById("outdoorTime").textContent
        };
        
        DatabaseManager.addOutdoorWorkout(currentStudentEmail, workout, database);
        this.updateOutdoorHistory(database, currentStudentEmail);
        
        document.getElementById("outdoorStartButton").disabled = false;
        document.getElementById("outdoorStopButton").disabled = true;
        document.getElementById("outdoorTracker").classList.add("hidden");
        document.getElementById("outdoor-selection").classList.remove("hidden");
        
        return database;
    }

    // Atualizar histórico outdoor
    updateOutdoorHistory(database, currentStudentEmail) {
        const historyList = document.getElementById("outdoorHistoryList");
        const workouts = database.outdoorWorkouts[currentStudentEmail] || [];
        
        if (workouts.length === 0) {
            historyList.innerHTML = '<p class="text-gray-400 text-center font-bold">Nenhum treino outdoor registrado.</p>';
            return;
        }
        
        historyList.innerHTML = workouts.slice().reverse().map(workout => `
            <div class="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-white">${workout.activity}</h4>
                    <p class="text-gray-400 text-sm font-bold">${new Date(workout.date).toLocaleDateString("pt-BR")}</p>
                </div>
                <div class="text-right">
                    <p class="text-white font-bold">${workout.distance} km</p>
                    <p class="text-gray-400 text-sm font-bold">${workout.duration}</p>
                </div>
            </div>
        `).join("");
    }

    // Calcular distância entre dois pontos (Haversine)
    haversineDistance(coords1, coords2) {
        const R = 6371000; // Raio da Terra em metros
        const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
        const dLon = (coords2.lng - coords1.lng) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}
