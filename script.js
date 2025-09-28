document.addEventListener('DOMContentLoaded', () => {
    // === BANCO DE DADOS E ESTADO GLOBAL ===
    let database = {};
    let currentStudentEmail = null;
    let currentCalendarDate = new Date();
    let outdoorMap, outdoorWatchId, outdoorTimerInterval, outdoorStartTime;
    let totalDistance = 0, trackPoints = [], lastPosition = null;
    let currentOutdoorActivity = null;
    let sleepStartTime, sleepTimerInterval, audioContext, microphone, analyser, motionListener;
    let noiseCount = 0, movementCount = 0;
    
    // Carrega dados do LocalStorage ou de um arquivo JSON
    async function loadDatabase() {
        const storedDb = localStorage.getItem('abfit_database');
        if (storedDb) {
            database = JSON.parse(storedDb);
        } else {
            try {
                const response = await fetch('database.json');
                database = await response.json();
                
                // Inicializa estruturas vazias se não existirem
                database.users.forEach(u => {
                    if (!database.trainingPlans[u.email]) database.trainingPlans[u.email] = { A:[], B:[], periodizacao:[], attendance:{} };
                    if (!database.outdoorWorkouts[u.email]) database.outdoorWorkouts[u.email] = [];
                    if (!database.sleepHistory[u.email]) database.sleepHistory[u.email] = [];
                });
                saveDatabase();
            } catch (error) {
                console.error("Falha ao carregar o banco de dados inicial.", error);
                alert("Não foi possível carregar os dados do aplicativo.");
            }
        }
    }

    function saveDatabase() {
        localStorage.setItem('abfit_database', JSON.stringify(database));
    }

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(screenId);
        if(targetScreen) targetScreen.classList.add('active');
        document.getElementById('bottom-nav').style.display = (screenId !== 'loginScreen') ? 'flex' : 'none';
        updateNav(screenId);
    }
    
    function updateNav(activeScreenId) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const target = btn.dataset.target;
            if ((target === 'studentProfileScreen' && (activeScreenId.includes('studentProfile') || activeScreenId.includes('training') || activeScreenId.includes('outdoor') || activeScreenId.includes('sleep'))) || target === activeScreenId) {
                 btn.classList.add('text-red-500'); btn.classList.remove('text-gray-400', 'hover:text-white');
            } else {
                btn.classList.remove('text-red-500'); btn.classList.add('text-gray-400', 'hover:text-white');
            }
        });
    }

    function populateUserSelection() {
        const container = document.getElementById('user-selection-container');
        container.innerHTML = database.users.map(user => `
            <div class="user-card flex items-center p-3 bg-gray-800 rounded-xl border border-gray-700 cursor-pointer hover:bg-gray-700 transition" data-user-email="${user.email}">
                <img src="${user.photo}" alt="${user.name}" class="w-12 h-12 rounded-full object-cover mr-4">
                <div class="flex-grow"><p class="font-bold text-white">${user.name}</p><span class="text-sm text-gray-400 font-bold">Acessar meu perfil</span></div>
                <i data-feather="log-in" class="text-red-500"></i>
            </div>
        `).join('');
        feather.replace();
    }
    function populateStudentList() {
        const container = document.getElementById('student-list-container');
        container.innerHTML = database.users.map(student => `
            <div class="student-card flex items-center p-3 bg-gray-800 rounded-xl border border-gray-700 cursor-pointer hover:bg-gray-700 transition" data-student-id="${student.id}">
                <img src="${student.photo}" alt="${student.name}" class="w-12 h-12 rounded-full object-cover mr-4">
                <div class="flex-grow"><p class="font-bold text-white">${student.name}</p><span class="text-sm text-gray-400 font-bold">Ver perfil completo</span></div>
                <i data-feather="user" class="text-blue-500"></i>
            </div>
        `).join('');
        feather.replace();
    }
    
    function populateStudentProfile(studentEmail) {
        currentStudentEmail = studentEmail;
        const student = database.users.find(s => s.email === studentEmail);
        if (!student) return;

        document.getElementById('student-profile-info').innerHTML = `
            <img src="${student.photo}" alt="${student.name}" class="w-14 h-14 rounded-full object-cover mr-4">
            <div><h2 class="text-xl font-bold text-white">${student.name}</h2><p class="text-gray-400 text-sm font-bold">${student.email}</p></div>`;
        document.getElementById('student-profile-buttons').innerHTML = `
            <button class="profile-action-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center space-y-1" data-action="A"><i data-feather="shield"></i><span class="text-xs font-bold">TREINO A</span></button>
            <button class="profile-action-btn bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center space-y-1" data-action="B"><i data-feather="zap"></i><span class="text-xs font-bold">TREINO B</span></button>
            <button class="profile-action-btn bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center space-y-1" data-action="corrida"><i data-feather="trending-up"></i><span class="text-xs font-bold">CORRIDA</span></button>
            <button class="profile-action-btn bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center space-y-1" data-action="periodizacao"><i data-feather="calendar"></i><span class="text-xs font-bold">PERIODIZAÇÃO</span></button>
            <button class="profile-action-btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center space-y-1" data-action="outdoor"><i data-feather="map-pin"></i><span class="text-xs font-bold">OUTDOOR</span></button>
            <button class="profile-action-btn bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center space-y-1" data-action="sleep"><i data-feather="moon"></i><span class="text-xs font-bold">SONO</span></button>
        `;
        feather.replace();
        renderCalendar();
    }
     function loadRunningScreen() {
        const runningWorkouts = database.userRunningWorkouts[currentStudentEmail] || [];
        document.getElementById('training-title').textContent = 'Treino de Corrida';
        const content = document.getElementById('training-content-wrapper');
        if (runningWorkouts.length === 0) {
            content.innerHTML = `<div class="text-center text-gray-400 font-bold">Nenhum treino de corrida cadastrado.</div>`; return;
        }
        content.innerHTML = runningWorkouts.map(w => `
            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <h3 class="font-extrabold text-lg ${'running-title-' + w.method.toLowerCase().replace('ã','a')}">${w.method} - ${w.date}</h3>
                <p class="text-white my-2"><strong class="font-bold text-gray-400">Detalhes:</strong> ${w.details}</p>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-gray-400 font-bold">Velocidade:</span> <span class="text-white font-bold">${w.speed}</span></div>
                    <div><span class="text-gray-400 font-bold">Ritmo:</span> <span class="text-white font-bold">${w.pace}</span></div>
                    <div><span class="text-gray-400 font-bold">Tempo:</span> <span class="text-white font-bold">${w.time}</span></div>
                </div>
            </div>`).join('');
    }

    function loadTrainingScreen(trainingType) {
        currentTrainingType = trainingType;
        const trainingPlan = [
            { id: 1, name: 'Exercício de Força 1', series: '3x10', img: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=E1' },
            { id: 2, name: 'Exercício de Força 2', series: '3x12', img: 'https://via.placeholder.com/80x80/10b981/ffffff?text=E2' }
        ];
        
        document.getElementById('training-title').textContent = `Treino ${trainingType}`;
        const content = document.getElementById('training-content-wrapper');
        content.innerHTML = trainingPlan.map(ex => `
            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                <div class="flex items-center">
                    <img src="${ex.img}" class="w-16 h-16 rounded-lg mr-4">
                    <div>
                        <p class="font-bold text-white">${ex.name}</p>
                        <p class="text-gray-300 text-sm font-bold">${ex.series}</p>
                    </div>
                </div>
                <button class="checkin-btn bg-green-600 hover:bg-green-700 text-white font-bold p-3 rounded-lg" data-training-type="${trainingType}">
                    <i data-feather="check"></i>
                </button>
            </div>`).join('');
        feather.replace();
    }
    
    function renderCalendar() {
        const attendance = (database.trainingPlans[currentStudentEmail] && database.trainingPlans[currentStudentEmail].attendance) || {};
        const monthYear = document.getElementById('calendar-month-year');
        const grid = document.getElementById('calendar-grid');
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        monthYear.textContent = currentCalendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        grid.innerHTML = '';
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        for (let i = 0; i < startingDay; i++) { grid.innerHTML += `<div class="calendar-day empty"></div>`; }
        
        const today = new Date().toISOString().split('T')[0];
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayAttendance = attendance[dateStr];
            const isToday = dateStr === today;
            grid.innerHTML += `<div class="calendar-day ${isToday ? 'today' : ''} ${dayAttendance ? `treino-${dayAttendance.type}` : ''}">${day}</div>`;
        }
    }

    function performCheckIn(trainingType) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!database.trainingPlans[currentStudentEmail]) database.trainingPlans[currentStudentEmail] = { attendance: {} };
        if (!database.trainingPlans[currentStudentEmail].attendance) database.trainingPlans[currentStudentEmail].attendance = {};
        
        database.trainingPlans[currentStudentEmail].attendance[todayStr] = { type: trainingType };
        saveDatabase();
        renderCalendar();
        alert(`Check-in do Treino ${trainingType} realizado com sucesso!`);
    }

    function initializeOutdoorScreen() {
        if (outdoorMap) outdoorMap.remove();
        document.getElementById('outdoorTracker').classList.add('hidden');
        document.getElementById('outdoor-selection').classList.remove('hidden');

        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            outdoorMap = L.map('outdoorMap').setView([latitude, longitude], 15);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(outdoorMap);
            L.marker([latitude, longitude]).addTo(outdoorMap);
        }, () => {
            outdoorMap = L.map('outdoorMap').setView([-22.919, -42.822], 13);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(outdoorMap);
            alert('Não foi possível obter sua localização.');
        });
        updateOutdoorHistory();
    }
    
    function startOutdoorTracking() {
        outdoorStartTime = Date.now();
        trackPoints = []; totalDistance = 0; lastPosition = null;

        document.getElementById('outdoorStartButton').disabled = true;
        document.getElementById('outdoorStopButton').disabled = false;
        
        outdoorTimerInterval = setInterval(() => {
            const diff = Math.floor((Date.now() - outdoorStartTime) / 1000);
            const h = String(Math.floor(diff / 3600)).padStart(2, '0');
            const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
            const s = String(diff % 60).padStart(2, '0');
            document.getElementById('outdoorTime').textContent = `${h}:${m}:${s}`;
        }, 1000);

        outdoorWatchId = navigator.geolocation.watchPosition(pos => {
            const { latitude, longitude, speed } = pos.coords;
            const currentPosition = { lat: latitude, lng: longitude };
            if (lastPosition) totalDistance += haversineDistance(lastPosition, currentPosition);
            lastPosition = currentPosition;
            
            const distanceKm = (totalDistance / 1000).toFixed(2);
            const speedKmh = speed ? (speed * 3.6).toFixed(1) : '0.0';
            const pace = speed > 0.5 ? (60 / (speed * 3.6)).toFixed(2).replace('.',':') : '--:--';

            document.getElementById('outdoorDistance').textContent = `${distanceKm} km`;
            document.getElementById('outdoorSpeed').textContent = `${speedKmh} km/h`;
            document.getElementById('outdoorPace').textContent = `${pace} /km`;
            outdoorMap.setView(currentPosition, 16);
        }, () => alert('Erro no GPS.'), { enableHighAccuracy: true });
    }
    
    function stopOutdoorTracking() {
        clearInterval(outdoorTimerInterval);
        navigator.geolocation.clearWatch(outdoorWatchId);
        
        const workout = {
            activity: currentOutdoorActivity,
            date: new Date().toISOString(),
            distance: document.getElementById('outdoorDistance').textContent.replace(' km',''),
            duration: document.getElementById('outdoorTime').textContent
        };
        database.outdoorWorkouts[currentStudentEmail].push(workout);
        saveDatabase();
        updateOutdoorHistory();
        
        document.getElementById('outdoorStartButton').disabled = false;
        document.getElementById('outdoorStopButton').disabled = true;
        document.getElementById('outdoorTracker').classList.add('hidden');
        document.getElementById('outdoor-selection').classList.remove('hidden');
    }

    function updateOutdoorHistory() {
        const historyContainer = document.getElementById('outdoorHistoryList');
        const workouts = database.outdoorWorkouts[currentStudentEmail] || [];
        if (workouts.length === 0) {
            historyContainer.innerHTML = '<p class="text-gray-400 text-center font-bold">Nenhum treino outdoor registrado.</p>';
            return;
        }
        historyContainer.innerHTML = workouts.slice().reverse().map(w => `
            <div class="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-white">${w.activity}</h4>
                    <p class="text-gray-400 text-sm font-bold">${new Date(w.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div class="text-right">
                    <p class="text-white font-bold">${w.distance} km</p>
                    <p class="text-gray-400 text-sm font-bold">${w.duration}</p>
                </div>
            </div>
        `).join('');
    }

    function haversineDistance(coords1, coords2) {
        const R = 6371e3; // metres
        const φ1 = coords1.lat * Math.PI/180;
        const φ2 = coords2.lat * Math.PI/180;
        const Δφ = (coords2.lat-coords1.lat) * Math.PI/180;
        const Δλ = (coords2.lng-coords1.lng) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // in metres
    }

    function initializeSleepScreen() {
        document.getElementById('sleep-tracker-controls').style.display = 'block';
        document.getElementById('sleep-tracker-active').classList.add('hidden');
        document.getElementById('sleepDuration').textContent = '00:00:00';
        document.getElementById('sleepMovements').textContent = '0';
        document.getElementById('sleepNoises').textContent = '0';
        noiseCount = 0;
        movementCount = 0;
        renderSleepHistory();
    }

    async function startSleepTracking() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            motionListener = (event) => {
                const { x, y, z } = event.accelerationIncludingGravity;
                const acceleration = Math.sqrt(x*x + y*y + z*z);
                if (acceleration > 12) {
                    movementCount++;
                    document.getElementById('sleepMovements').textContent = movementCount;
                }
            };
            window.addEventListener('devicemotion', motionListener);

            sleepStartTime = Date.now();
            document.getElementById('sleep-tracker-controls').style.display = 'none';
            document.getElementById('sleep-tracker-active').classList.remove('hidden');

            sleepTimerInterval = setInterval(() => {
                const diff = Math.floor((Date.now() - sleepStartTime) / 1000);
                const h = String(Math.floor(diff / 3600)).padStart(2, '0');
                const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
                const s = String(diff % 60).padStart(2, '0');
                document.getElementById('sleepDuration').textContent = `${h}:${m}:${s}`;
                
                analyser.getByteFrequencyData(dataArray);
                let sum = dataArray.reduce((a, b) => a + b, 0);
                let average = sum / bufferLength;
                document.getElementById('volumeBar').style.width = `${average}%`;
                if (average > 50) {
                    noiseCount++;
                    document.getElementById('sleepNoises').textContent = noiseCount;
                }
            }, 500);

        } catch (err) {
            alert('Erro ao acessar microfone ou sensores. Por favor, conceda a permissão.');
        }
    }

    function stopSleepTracking() {
        clearInterval(sleepTimerInterval);
        window.removeEventListener('devicemotion', motionListener);
        if (microphone) microphone.mediaStream.getTracks().forEach(track => track.stop());
        if (audioContext) audioContext.close();

        const sleepRecord = {
            date: new Date().toISOString(),
            duration: document.getElementById('sleepDuration').textContent,
            movements: movementCount,
            noises: noiseCount
        };
        if (!database.sleepHistory) database.sleepHistory = {};
        if (!database.sleepHistory[currentStudentEmail]) database.sleepHistory[currentStudentEmail] = [];
        database.sleepHistory[currentStudentEmail].push(sleepRecord);
        saveDatabase();
        initializeSleepScreen();
    }

    function renderSleepHistory() {
        const historyContainer = document.getElementById('sleepHistoryList');
        const history = (database.sleepHistory && database.sleepHistory[currentStudentEmail]) || [];
        if (history.length === 0) {
            historyContainer.innerHTML = '<p class="text-gray-400 text-center font-bold">Nenhum registro de sono.</p>';
            return;
        }
        historyContainer.innerHTML = history.slice().reverse().map(rec => `
            <div class="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-white">${new Date(rec.date).toLocaleDateString('pt-BR')}</h4>
                    <p class="text-gray-400 text-sm font-bold">Duração: ${rec.duration}</p>
                </div>
                <div class="text-right">
                    <p class="text-white font-bold">${rec.movements} mov.</p>
                    <p class="text-gray-400 text-sm font-bold">${rec.noises} ruídos</p>
                </div>
            </div>
        `).join('');
    }

    document.body.addEventListener("click",t=>{const e=t.target.closest(".user-card");if(e)return populateStudentProfile(e.dataset.userEmail),void showScreen("studentProfileScreen");const n=t.target.closest(".student-card");if(n){const t=database.users.find(t=>t.id==n.dataset.studentId);return void(t&&(populateStudentProfile(t.email),showScreen("studentProfileScreen")))}const o=t.target.closest(".nav-btn, .back-btn");if(o)return void showScreen(o.dataset.target);const a=t.target.closest(".profile-action-btn");if(a){const t=a.dataset.action;return"A"===t||"B"===t?(loadTrainingScreen(t),showScreen("trainingScreen")):"corrida"===t?(loadRunningScreen(),showScreen("trainingScreen")):"outdoor"===t?(initializeOutdoorScreen(),showScreen("outdoorScreen")):"sleep"===t&&(initializeSleepScreen(),showScreen("sleepScreen")),void 0}const i=t.target.closest(".checkin-btn");if(i)return void performCheckIn(i.dataset.trainingType);t.target.closest("#prev-month-btn")&&(currentCalendarDate.setMonth(currentCalendarDate.getMonth()-1),renderCalendar()),t.target.closest("#next-month-btn")&&(currentCalendarDate.setMonth(currentCalendarDate.getMonth()+1),renderCalendar());const d=t.target.closest(".outdoor-activity-btn");d&&(currentOutdoorActivity=d.dataset.activity,document.getElementById("outdoor-selection").classList.add("hidden"),document.getElementById("outdoorTracker").classList.remove("hidden")),t.target.closest("#outdoorStartButton")&&startOutdoorTracking(),t.target.closest("#outdoorStopButton")&&stopOutdoorTracking(),t.target.closest("#startSleepBtn")&&startSleepTracking(),t.target.closest("#stopSleepBtn")&&stopSleepTracking()});
    
    async function initApp(){
        feather.replace();
        await loadDatabase();
        const splash = document.getElementById('splashScreen'), app = document.getElementById('appContainer');
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = "none";
                app.style.display = "flex";
                app.classList.remove('hidden');
                populateUserSelection();
                populateStudentList();
                showScreen('loginScreen');
            }, 500);
        }, 1500);
    }
    
    initApp();
});
</script>
