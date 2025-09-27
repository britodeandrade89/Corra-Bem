document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const screens = {
        selection: document.getElementById('activitySelection'),
        tracker: document.getElementById('tracker'),
        history: document.getElementById('history'),
        detail: document.getElementById('workoutDetail')
    };
    const activityTitle = document.getElementById('activityTitle');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const historyButton = document.getElementById('historyButton');
    const timeEl = document.getElementById('time');
    const distanceEl = document.getElementById('distance');
    const paceEl = document.getElementById('pace');
    const speedEl = document.getElementById('speed');
    const extraMetricsEl = document.getElementById('extraMetrics');
    const avgPaceEl = document.getElementById('avgPace');
    const avgSpeedEl = document.getElementById('avgSpeed');
    const elevationEl = document.getElementById('elevation');
    const feelsLikeTempEl = document.getElementById('feelsLikeTemp');
    const summaryModal = document.getElementById('summaryModal');
    const photoInput = document.getElementById('photoInput');
    const photoPreview = document.getElementById('photoPreview');
    const saveButton = document.getElementById('saveButton');
    const discardButton = document.getElementById('discardButton');
    const historyListEl = document.getElementById('historyList');

    // --- VARIÁVEIS DE ESTADO ---
    let map, detailMap, polyline, marker;
    let watchId = null, timerInterval = null;
    let startTime = 0, endTime = 0;
    let totalDistance = 0, startAltitude = null;
    let lastPosition = null;
    let trackPoints = [];
    let currentActivity = '', photoBase64 = null;

    // --- NAVEGAÇÃO ENTRE TELAS ---
    const showScreen = (screenName) => {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    };

    // --- INICIALIZAÇÃO E SELEÇÃO DE ATIVIDADE ---
    document.querySelectorAll('.activity-btn').forEach(button => {
        button.addEventListener('click', () => {
            currentActivity = button.getAttribute('data-activity');
            activityTitle.textContent = currentActivity;
            if (currentActivity.includes('Corrida') || currentActivity.includes('Caminhada')) {
                extraMetricsEl.style.display = 'grid';
            } else {
                extraMetricsEl.style.display = 'none';
            }
            showScreen('tracker');
            initializeMap('map');
        });
    });

    historyButton.addEventListener('click', () => {
        showScreen('history');
        renderHistory();
    });

    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', () => {
            const currentScreen = button.closest('.screen');
            if (currentScreen.id === 'detail') showScreen('history');
            else showScreen('selection');
        });
    });

    // --- LÓGICA DO RASTREADOR ---
    const startTracking = () => {
        resetState();
        startTime = Date.now();
        startButton.disabled = true;
        stopButton.disabled = false;
        timerInterval = setInterval(updateTimer, 1000);
        watchId = navigator.geolocation.watchPosition(handlePositionUpdate, handlePositionError, { enableHighAccuracy: true });
        navigator.geolocation.getCurrentPosition(pos => getWeatherData(pos.coords.latitude, pos.coords.longitude));
    };

    const stopTracking = () => {
        endTime = Date.now();
        if (watchId) navigator.geolocation.clearWatch(watchId);
        if (timerInterval) clearInterval(timerInterval);
        showSummary();
        startButton.disabled = false;
        stopButton.disabled = true;
        watchId = null;
        timerInterval = null;
    };

    const handlePositionUpdate = (position) => {
        const { latitude, longitude, speed, altitude } = position.coords;
        const currentPosition = { lat: latitude, lng: longitude };
        if (startAltitude === null && altitude) startAltitude = altitude;
        trackPoints.push({ lat: latitude, lon: longitude, time: new Date(position.timestamp) });
        if (!marker) {
            marker = L.marker(currentPosition).addTo(map);
            polyline = L.polyline([], { color: '#dc3545', weight: 4 }).addTo(map);
        }
        marker.setLatLng(currentPosition);
        polyline.addLatLng(currentPosition);
        map.panTo(currentPosition);
        if (lastPosition) totalDistance += haversineDistance(lastPosition, currentPosition);
        lastPosition = currentPosition;
        updateMetrics(speed, altitude);
    };

    const updateMetrics = (speedInMps, currentAltitude) => {
        const distanceKm = totalDistance / 1000;
        const elapsedTimeSeconds = (Date.now() - startTime) / 1000;
        const speedKmh = speedInMps ? (speedInMps * 3.6) : 0;
        let paceMin = 0, paceSec = 0;
        if (speedKmh > 1) {
            const paceSecondsPerKm = 3600 / speedKmh;
            paceMin = Math.floor(paceSecondsPerKm / 60);
            paceSec = Math.round(paceSecondsPerKm % 60);
        }
        const avgSpeedKmh = elapsedTimeSeconds > 0 ? (distanceKm / (elapsedTimeSeconds / 3600)) : 0;
        let avgPaceMin = 0, avgPaceSec = 0;
        if (distanceKm > 0) {
            const avgPaceSecondsPerKm = elapsedTimeSeconds / distanceKm;
            avgPaceMin = Math.floor(avgPaceSecondsPerKm / 60);
            avgPaceSec = Math.round(avgPaceSecondsPerKm % 60);
        }
        let elevationGain = 0;
        if (startAltitude && currentAltitude) elevationGain = Math.max(0, currentAltitude - startAltitude);
        distanceEl.textContent = `${distanceKm.toFixed(2)} km`;
        speedEl.textContent = `${speedKmh.toFixed(1)} km/h`;
        paceEl.textContent = speedKmh > 1 ? `${paceMin}:${paceSec.toString().padStart(2, '0')} /km` : '--:-- /km';
        avgSpeedEl.textContent = `${avgSpeedKmh.toFixed(1)} km/h`;
        avgPaceEl.textContent = distanceKm > 0 ? `${avgPaceMin}:${avgPaceSec.toString().padStart(2, '0')} /km` : '--:-- /km';
        elevationEl.textContent = `${elevationGain.toFixed(0)} m`;
    };

    // --- LÓGICA DO MODAL E SALVAMENTO ---
    const showSummary = () => {
        document.getElementById('summaryStats').innerHTML = `<p><strong>Distância:</strong> ${distanceEl.textContent}</p><p><strong>Tempo:</strong> ${timeEl.textContent}</p>`;
        summaryModal.classList.add('active');
    };

    photoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.src = e.target.result;
                photoBase64 = e.target.result;
                photoPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    saveButton.addEventListener('click', () => {
        const workouts = JSON.parse(localStorage.getItem('abfit_workouts')) || [];
        const newWorkout = {
            id: startTime, activity: currentActivity, startTime, endTime,
            distance: totalDistance, duration: (endTime - startTime) / 1000,
            trackPoints, photo: photoBase64
        };
        workouts.push(newWorkout);
        localStorage.setItem('abfit_workouts', JSON.stringify(workouts));
        alert('Treino salvo com sucesso!');
        hideSummaryAndReset();
    });

    discardButton.addEventListener('click', () => hideSummaryAndReset());

    const hideSummaryAndReset = () => {
        summaryModal.classList.remove('active');
        setTimeout(() => { // Reseta após a animação de fade-out
            photoPreview.style.display = 'none';
            photoPreview.src = '';
            photoInput.value = '';
            photoBase64 = null;
            goBackToSelection();
        }, 300);
    };

    // --- LÓGICA DO HISTÓRICO ---
    const renderHistory = () => {
        const workouts = JSON.parse(localStorage.getItem('abfit_workouts')) || [];
        historyListEl.innerHTML = '';
        if (workouts.length === 0) {
            historyListEl.innerHTML = '<li><p>Nenhum treino registrado ainda.</p></li>';
            return;
        }
        workouts.sort((a, b) => b.id - a.id).forEach(workout => {
            const li = document.createElement('li');
            li.dataset.workoutId = workout.id;
            const date = new Date(workout.startTime).toLocaleDateString('pt-BR');
            const distanceKm = (workout.distance / 1000).toFixed(2);
            li.innerHTML = `<strong>${workout.activity}</strong><p>${date} - ${distanceKm} km</p>`;
            li.addEventListener('click', () => showWorkoutDetail(workout.id));
            historyListEl.appendChild(li);
        });
    };
    
    const showWorkoutDetail = (id) => {
        const workouts = JSON.parse(localStorage.getItem('abfit_workouts')) || [];
        const workout = workouts.find(w => w.id === id);
        if (!workout) return;
        showScreen('detail');
        document.getElementById('detailActivityTitle').textContent = workout.activity;
        const photoEl = document.getElementById('detailPhoto');
        if (workout.photo) {
            photoEl.src = workout.photo;
            photoEl.style.display = 'block';
        } else {
            photoEl.style.display = 'none';
        }
        const pace = workout.distance > 0 ? (workout.duration / (workout.distance / 1000)) : 0;
        document.getElementById('detailStats').innerHTML = `
            <p><strong>Data:</strong> ${new Date(workout.startTime).toLocaleDateString('pt-BR')}</p>
            <p><strong>Início:</strong> ${new Date(workout.startTime).toLocaleTimeString('pt-BR')}</p>
            <p><strong>Término:</strong> ${new Date(workout.endTime).toLocaleTimeString('pt-BR')}</p>
            <p><strong>Distância:</strong> ${(workout.distance / 1000).toFixed(2)} km</p>
            <p><strong>Duração:</strong> ${formatTime(Math.round(workout.duration))}</p>
            <p><strong>Ritmo Médio:</strong> ${pace > 0 ? `${Math.floor(pace / 60)}:${Math.round(pace % 60).toString().padStart(2, '0')} /km` : 'N/A'}</p>`;
        if (detailMap) detailMap.remove();
        initializeMap('detailMap', (mapInstance) => {
            detailMap = mapInstance;
            if (workout.trackPoints && workout.trackPoints.length > 0) {
                const latlngs = workout.trackPoints.map(p => [p.lat, p.lon]);
                L.polyline(latlngs, { color: '#dc3545', weight: 4 }).addTo(detailMap);
                detailMap.fitBounds(latlngs);
            }
        });
    };

    // --- FUNÇÕES UTILITÁRIAS ---
    const resetState = () => {
        totalDistance = 0; lastPosition = null; trackPoints = []; startTime = 0; endTime = 0;
        photoBase64 = null; startAltitude = null;
        timeEl.textContent = '00:00:00'; distanceEl.textContent = '0.00 km';
        paceEl.textContent = '--:-- /km'; speedEl.textContent = '0.0 km/h';
        feelsLikeTempEl.textContent = '-- °C'; avgPaceEl.textContent = '--:-- /km';
        avgSpeedEl.textContent = '0.0 km/h'; elevationEl.textContent = '0 m';
        if (marker) { marker.remove(); marker = null; }
        if (polyline) { polyline.remove(); polyline = null; }
    };
    const initializeMap = (mapId, callback) => {
        if (mapId === 'map' && map) map.remove();
        if (mapId === 'detailMap' && detailMap) detailMap.remove();
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            const mapInstance = L.map(mapId, { zoomControl: false }).setView([latitude, longitude], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(mapInstance);
            if (mapId === 'map') map = mapInstance;
            if (mapId === 'detailMap' && callback) callback(mapInstance);
        }, () => alert('Não foi possível obter sua localização.'));
    };
    const updateTimer = () => {
        const elapsedTimeSeconds = Math.floor((Date.now() - startTime) / 1000);
        timeEl.textContent = formatTime(elapsedTimeSeconds);
    };
    const getWeatherData = async (lat, lon) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=apparent_temperature`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            feelsLikeTempEl.textContent = `${Math.round(data.current.apparent_temperature)} °C`;
        } catch (error) { console.error('Falha ao buscar clima:', error); }
    };
    const goBackToSelection = () => { resetState(); showScreen('selection'); };
    const handlePositionError = (error) => alert(`Erro de GPS: ${error.message}`);
    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.round(totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };
    const haversineDistance = (c1, c2) => {
        const R = 6371e3;
        const lat1 = c1.lat * Math.PI/180, lat2 = c2.lat * Math.PI/180;
        const dLat = (c2.lat-c1.lat) * Math.PI/180, dLon = (c2.lng-c1.lng) * Math.PI/180;
        const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)*Math.sin(dLon/2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    };
    
    // --- EVENT LISTENERS GERAIS ---
    startButton.addEventListener('click', startTracking);
    stopButton.addEventListener('click', stopTracking);
    showScreen('selection');
});
