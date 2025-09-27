document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const screens = {
        selection: document.getElementById('activitySelection'),
        tracker: document.getElementById('tracker'),
        history: document.getElementById('history'),
        detail: document.getElementById('workoutDetail')
    };
    // ... (outros elementos do DOM como na versão anterior)
    const extraMetricsEl = document.getElementById('extraMetrics');
    const avgPaceEl = document.getElementById('avgPace');
    const avgSpeedEl = document.getElementById('avgSpeed');
    const elevationEl = document.getElementById('elevation');
    const feelsLikeTempEl = document.getElementById('feelsLikeTemp');

    // --- VARIÁVEIS DE ESTADO ---
    // ... (variáveis de estado da versão anterior)
    let startAltitude = null; // NOVA: Para calcular elevação
    
    // --- NAVEGAÇÃO E INICIALIZAÇÃO ---
    document.querySelectorAll('.activity-btn').forEach(button => {
        button.addEventListener('click', () => {
            currentActivity = button.getAttribute('data-activity');
            activityTitle.textContent = currentActivity;

            // NOVA: Exibe métricas extras apenas para corrida e caminhada
            if (currentActivity.includes('Corrida') || currentActivity.includes('Caminhada')) {
                extraMetricsEl.style.display = 'grid';
            } else {
                extraMetricsEl.style.display = 'none';
            }
            
            showScreen('tracker');
            initializeMap('map');
        });
    });

    const startTracking = () => {
        resetState();
        startTime = Date.now();
        startButton.disabled = true; stopButton.disabled = false;
        timerInterval = setInterval(updateTimer, 1000);
        watchId = navigator.geolocation.watchPosition(handlePositionUpdate, handlePositionError, { enableHighAccuracy: true });
        
        // NOVA: Busca a sensação térmica no início do treino
        navigator.geolocation.getCurrentPosition(pos => {
            getWeatherData(pos.coords.latitude, pos.coords.longitude);
        });
    };
    
    // --- LÓGICA DE ATUALIZAÇÃO ---
    const handlePositionUpdate = (position) => {
        const { latitude, longitude, speed, altitude } = position.coords;
        const currentPosition = { lat: latitude, lng: longitude };
        
        // NOVA: Define a altitude inicial no primeiro ponto GPS
        if (startAltitude === null && altitude) {
            startAltitude = altitude;
        }

        // ... (resto da função como antes: adicionar pontos, atualizar mapa)

        if (lastPosition) totalDistance += haversineDistance(lastPosition, currentPosition);
        lastPosition = currentPosition;
        updateMetrics(speed, altitude); // Passa a altitude atual
    };
    
    const updateMetrics = (speedInMps, currentAltitude) => {
        const distanceKm = totalDistance / 1000;
        const elapsedTimeSeconds = (Date.now() - startTime) / 1000;

        // Velocidade e Ritmo Instantâneos
        const speedKmh = speedInMps ? (speedInMps * 3.6) : 0;
        let paceMin = 0, paceSec = 0;
        if (speedKmh > 1) { // Só calcula o ritmo se houver velocidade
            const paceSecondsPerKm = 3600 / speedKmh;
            paceMin = Math.floor(paceSecondsPerKm / 60);
            paceSec = Math.round(paceSecondsPerKm % 60);
        }
        
        // Métricas Médias
        const avgSpeedKmh = elapsedTimeSeconds > 0 ? (distanceKm / (elapsedTimeSeconds / 3600)) : 0;
        let avgPaceMin = 0, avgPaceSec = 0;
        if (distanceKm > 0) {
            const avgPaceSecondsPerKm = elapsedTimeSeconds / distanceKm;
            avgPaceMin = Math.floor(avgPaceSecondsPerKm / 60);
            avgPaceSec = Math.round(avgPaceSecondsPerKm % 60);
        }

        // Elevação
        let elevationGain = 0;
        if (startAltitude && currentAltitude) {
            elevationGain = Math.max(0, currentAltitude - startAltitude);
        }
        
        // Atualiza DOM
        distanceEl.textContent = `${distanceKm.toFixed(2)} km`;
        speedEl.textContent = `${speedKmh.toFixed(1)} km/h`;
        paceEl.textContent = speedKmh > 1 ? `${paceMin}:${paceSec.toString().padStart(2, '0')} /km` : '--:-- /km';
        
        // Atualiza DOM das métricas extras
        avgSpeedEl.textContent = `${avgSpeedKmh.toFixed(1)} km/h`;
        avgPaceEl.textContent = distanceKm > 0 ? `${avgPaceMin}:${avgPaceSec.toString().padStart(2, '0')} /km` : '--:-- /km';
        elevationEl.textContent = `${elevationGain.toFixed(0)} m`;
    };

    // NOVA: Função para buscar dados de clima
    const getWeatherData = async (lat, lon) => {
        // API gratuita e sem chave: Open-Meteo
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=apparent_temperature`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Resposta da rede não foi ok.');
            const data = await response.json();
            const feelsLike = data.current.apparent_temperature;
            feelsLikeTempEl.textContent = `${Math.round(feelsLike)} °C`;
        } catch (error) {
            console.error('Falha ao buscar dados de clima:', error);
            feelsLikeTempEl.textContent = '-- °C';
        }
    };
    
    const resetState = () => {
        // ... (resto da função como antes)
        startAltitude = null; // Reseta a altitude
        feelsLikeTempEl.textContent = '-- °C';
        avgPaceEl.textContent = '--:-- /km';
        avgSpeedEl.textContent = '0.0 km/h';
        elevationEl.textContent = '0 m';
    };

    // Cole o resto do seu script.js da versão anterior aqui (funções de salvar, histórico, utilitárias, etc.)
    // As funções abaixo são da versão anterior e não precisam de alteração.
    const showScreen = (screenName) => {
        Object.values(screens).forEach(screen => screen.style.display = 'none');
        screens[screenName].style.display = 'block';
    };
    const initializeMap = (mapId, callback) => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            const mapInstance = L.map(mapId, { zoomControl: false }).setView([latitude, longitude], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
            if (callback) callback(mapInstance);
        }, () => {
            const mapInstance = L.map(mapId).setView([-22.9068, -43.1729], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
            alert('Não foi possível obter sua localização.');
            if (callback) callback(mapInstance);
        });
    };
    const stopTracking = () => {
        endTime = Date.now();
        if (watchId) navigator.geolocation.clearWatch(watchId);
        if (timerInterval) clearInterval(timerInterval);
        showSummary();
        startButton.disabled = false; stopButton.disabled = true;
        watchId = null; timerInterval = null;
    };
    const updateTimer = () => {
        const elapsedTimeSeconds = Math.floor((Date.now() - startTime) / 1000);
        timeEl.textContent = formatTime(elapsedTimeSeconds);
    };
    const showSummary = () => {
        document.getElementById('summaryStats').innerHTML = `
            <p><strong>Distância:</strong> ${distanceEl.textContent}</p>
            <p><strong>Tempo:</strong> ${timeEl.textContent}</p>
        `;
        summaryModal.style.display = 'flex';
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
        summaryModal.style.display = 'none';
        photoPreview.style.display = 'none'; photoPreview.src = '';
        photoInput.value = ''; photoBase64 = null;
        goBackToSelection();
    };
    const renderHistory = () => {
        const workouts = JSON.parse(localStorage.getItem('abfit_workouts')) || [];
        historyListEl.innerHTML = '';
        if (workouts.length === 0) {
            historyListEl.innerHTML = '<p>Nenhum treino registrado ainda.</p>'; return;
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
        const workout = workouts.find(w => w.id === id); if (!workout) return;
        showScreen('detail');
        document.getElementById('detailActivityTitle').textContent = workout.activity;
        const photoEl = document.getElementById('detailPhoto');
        if (workout.photo) { photoEl.src = workout.photo; photoEl.style.display = 'block'; }
        else { photoEl.style.display = 'none'; }
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
                L.polyline(latlngs, { color: '#e74c3c', weight: 3 }).addTo(detailMap);
                detailMap.fitBounds(latlngs);
            }
        });
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
    historyButton.addEventListener('click', () => { showScreen('history'); renderHistory(); });
    document.querySelectorAll('.back-button').forEach(button => button.addEventListener('click', () => {
        if (screens.detail.style.display === 'block') { showScreen('history'); }
        else if (screens.history.style.display === 'block') { showScreen('selection'); }
    }));
    startButton.addEventListener('click', startTracking);
    stopButton.addEventListener('click', stopTracking);
    showScreen('selection');
});
