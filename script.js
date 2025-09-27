document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const timeEl = document.getElementById('time');
    const distanceEl = document.getElementById('distance');
    const paceEl = document.getElementById('pace');
    const speedEl = document.getElementById('speed');
    const jsonOutputEl = document.getElementById('jsonOutput');

    // Variáveis de estado
    let map, polyline, marker;
    let watchId = null;
    let timerInterval = null;
    let startTime = 0;
    let totalDistance = 0; // em metros
    let lastPosition = null;
    let trackPoints = [];

    // --- INICIALIZAÇÃO ---
    // Inicializa o mapa na localização atual do usuário
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        map = L.map('map').setView([latitude, longitude], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }, () => {
        // Fallback se a localização for negada ou falhar
        map = L.map('map').setView([-22.9068, -43.1729], 13); // Centro do Rio de Janeiro
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        alert('Não foi possível obter sua localização. O mapa foi centralizado no Rio de Janeiro.');
    });

    // --- FUNÇÕES DE CONTROLE ---
    const startTracking = () => {
        // Reseta o estado anterior
        resetState();
        jsonOutputEl.textContent = 'A atividade está em andamento...';
        
        // Configurações iniciais
        startTime = Date.now();
        startButton.disabled = true;
        stopButton.disabled = false;
        
        // Inicia o timer para atualizar o tempo decorrido
        timerInterval = setInterval(updateTimer, 1000);

        // Inicia o monitoramento da posição GPS
        watchId = navigator.geolocation.watchPosition(
            handlePositionUpdate, 
            handlePositionError, 
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const stopTracking = () => {
        // Para os monitoramentos
        if (watchId) navigator.geolocation.clearWatch(watchId);
        if (timerInterval) clearInterval(timerInterval);

        // Gera o JSON final
        generateFinalJSON();
        
        // Atualiza a UI
        startButton.disabled = false;
        stopButton.disabled = true;
        watchId = null;
        timerInterval = null;
    };

    // --- LÓGICA DE ATUALIZAÇÃO ---
    const handlePositionUpdate = (position) => {
        const { latitude, longitude, speed } = position.coords;
        const currentPosition = { lat: latitude, lng: longitude };
        
        // Adiciona ponto à trilha
        trackPoints.push({ lat: latitude, lon: longitude, time: new Date(position.timestamp) });

        // Atualiza o mapa
        if (!marker) {
            marker = L.marker(currentPosition).addTo(map);
            polyline = L.polyline([], { color: 'red' }).addTo(map);
        }
        marker.setLatLng(currentPosition);
        polyline.addLatLng(currentPosition);
        map.panTo(currentPosition);

        // Calcula distância se não for o primeiro ponto
        if (lastPosition) {
            totalDistance += haversineDistance(lastPosition, currentPosition);
        }
        lastPosition = currentPosition;

        // Atualiza as métricas na tela
        updateMetrics();
    };

    const updateMetrics = () => {
        const distanceKm = totalDistance / 1000;
        const elapsedTimeSeconds = (Date.now() - startTime) / 1000;

        // Velocidade em km/h
        const speedKmh = (distanceKm / (elapsedTimeSeconds / 3600)) || 0;

        // Ritmo (pace) em min/km
        let paceMin = 0, paceSec = 0;
        if (distanceKm > 0) {
            const paceSecondsPerKm = elapsedTimeSeconds / distanceKm;
            paceMin = Math.floor(paceSecondsPerKm / 60);
            paceSec = Math.round(paceSecondsPerKm % 60);
        }

        distanceEl.textContent = `${distanceKm.toFixed(2)} km`;
        speedEl.textContent = `${speedKmh.toFixed(1)} km/h`;
        paceEl.textContent = distanceKm > 0 ? `${paceMin}:${paceSec.toString().padStart(2, '0')} /km` : '--:-- /km';
    };

    const updateTimer = () => {
        const elapsedTimeSeconds = Math.floor((Date.now() - startTime) / 1000);
        timeEl.textContent = formatTime(elapsedTimeSeconds);
    };

    const generateFinalJSON = () => {
        const totalTimeSeconds = (Date.now() - startTime) / 1000;
        const distanceKm = totalDistance / 1000;
        const avgSpeed = (distanceKm / (totalTimeSeconds / 3600)) || 0;
        const avgPace = totalTimeSeconds / distanceKm || 0;

        const activityData = {
            summary: {
                totalDistance_km: parseFloat(distanceKm.toFixed(3)),
                totalTime: formatTime(Math.floor(totalTimeSeconds)),
                totalTime_seconds: parseFloat(totalTimeSeconds.toFixed(1)),
                averageSpeed_kmh: parseFloat(avgSpeed.toFixed(2)),
                averagePace_min_km: distanceKm > 0 ? `${Math.floor(avgPace / 60)}:${Math.round(avgPace % 60).toString().padStart(2, '0')}` : "N/A"
            },
            track: trackPoints
        };

        // Exibe o JSON formatado
        jsonOutputEl.textContent = JSON.stringify(activityData, null, 2);
    };
    
    // --- FUNÇÕES UTILITÁRIAS ---
    const resetState = () => {
        totalDistance = 0;
        lastPosition = null;
        trackPoints = [];
        startTime = 0;
        
        // Limpa métricas da tela
        timeEl.textContent = '00:00:00';
        distanceEl.textContent = '0.00 km';
        paceEl.textContent = '--:-- /km';
        speedEl.textContent = '0.0 km/h';

        // Limpa o mapa
        if (marker) marker.remove();
        if (polyline) polyline.remove();
        marker = null;
        polyline = null;
    };

    const handlePositionError = (error) => {
        alert(`Erro de GPS: ${error.message} (código: ${error.code})`);
        stopTracking();
    };

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Fórmula de Haversine para calcular distância entre duas coordenadas
    const haversineDistance = (coords1, coords2) => {
        const R = 6371e3; // Raio da Terra em metros
        const lat1 = coords1.lat * Math.PI / 180;
        const lat2 = coords2.lat * Math.PI / 180;
        const deltaLat = (coords2.lat - coords1.lat) * Math.PI / 180;
        const deltaLon = (coords2.lng - coords1.lng) * Math.PI / 180;

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distância em metros
    };

    // Adiciona os event listeners aos botões
    startButton.addEventListener('click', startTracking);
    stopButton.addEventListener('click', stopTracking);
});
