// app.js - Aplicação principal AB Fit Outdoor

document.addEventListener('DOMContentLoaded', () => {
    // === ESTADO GLOBAL ===
    let database = {};
    let currentStudentEmail = null;
    let currentCalendarDate = new Date();
    let currentTrainingType = null;
    
    // Instâncias dos módulos
    const sleepTracker = new SleepTracker();
    const outdoorTracker = new OutdoorTracker();

    // === FUNÇÕES PRINCIPAIS ===
    function initApp() {
        feather.replace();
        database = DatabaseManager.loadDatabase();
        
        const splashScreen = document.getElementById("splashScreen");
        const appContainer = document.getElementById("appContainer");
        
        setTimeout(() => {
            splashScreen.classList.add("fade-out");
            setTimeout(() => {
                splashScreen.style.display = "none";
                appContainer.style.display = "flex";
                appContainer.classList.remove("hidden");
                populateUserSelection();
                populateStudentList();
                showScreen("loginScreen");
            }, 500);
        }, 1500);
    }
    
    function showScreen(screenId) {
        document.querySelectorAll(".screen").forEach(screen => {
            screen.classList.remove("active");
        });
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add("active");
        }
        
        document.getElementById("bottom-nav").style.display = screenId === "loginScreen" ? "none" : "flex";
        updateNav(screenId);
    }
    
    function updateNav(screenId) {
        document.querySelectorAll(".nav-btn").forEach(btn => {
            const target = btn.dataset.target;
            if ((target === "studentProfileScreen" && screenId.includes("studentProfile")) || target === screenId) {
                btn.classList.add("text-red-500");
                btn.classList.remove("text-gray-400", "hover:text-white");
            } else {
                btn.classList.remove("text-red-500");
                btn.classList.add("text-gray-400", "hover:text-white");
            }
        });
    }
    
    function populateUserSelection() {
        const container = document.getElementById("user-selection-container");
        container.innerHTML = database.users.map(user => `
            <div class="user-card flex items-center p-3 bg-gray-800 rounded-xl border border-gray-700 cursor-pointer hover:bg-gray-700 transition" data-user-email="${user.email}">
                <img src="${user.photo}" alt="${user.name}" class="w-12 h-12 rounded-full object-cover mr-4">
                <div class="flex-grow">
                    <p class="font-bold text-white">${user.name}</p>
                    <span class="text-sm text-gray-400 font-bold">${user.level} • Acessar meu perfil</span>
                </div>
                <i data-feather="log-in" class="text-red-500"></i>
            </div>
        `).join("");
        feather.replace();
    }
    
    function populateStudentList() {
        const container = document.getElementById("student-list-container");
        container.innerHTML = database.users.map(user => `
            <div class="student-card flex items-center p-3 bg-gray-800 rounded-xl border border-gray-700 cursor-pointer hover:bg-gray-700 transition" data-student-id="${user.id}">
                <img src="${user.photo}" alt="${user.name}" class="w-12 h-12 rounded-full object-cover mr-4">
                <div class="flex-grow">
                    <p class="font-bold text-white">${user.name}</p>
                    <span class="text-sm text-gray-400 font-bold">${user.level} • Ver perfil completo</span>
                </div>
                <i data-feather="user" class="text-blue-500"></i>
            </div>
        `).join("");
        feather.replace();
    }
    
    function populateStudentProfile(studentEmail) {
        currentStudentEmail = studentEmail;
        const student = DatabaseManager.getUserByEmail(studentEmail, database);
        if (!student) return;

        document.getElementById('student-profile-info').innerHTML = `
            <div class="flex items-center mb-6">
                <img src="${student.photo}" alt="${student.name}" class="w-20 h-20 rounded-full object-cover mr-4 border-2 border-gray-600">
                <div>
                    <h1 class="text-2xl font-bold text-white">${student.name}</h1>
                    <p class="text-gray-400 font-bold">${student.email}</p>
                    <p class="text-gray-500 text-sm font-bold">${student.level} • Desde ${new Date(student.joinDate).toLocaleDateString('pt-BR')}</p>
                </div>
            </div>
        `;
        
        document.getElementById('student-profile-buttons').innerHTML = `
            <button class="profile-action-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center space-y-1" data-action="A">
                <i data-feather="shield"></i>
                <span class="text-xs font-bold">TREINO A</span>
            </button>
            <button class="profile-action-btn bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center space-y-1" data-action="B">
                <i data-feather="zap"></i>
                <span class="text-xs font-bold">TREINO B</span>
            </button>
            <button class="profile-action-btn bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center space-y-1" data-action="corrida">
                <i data-feather="trending-up"></i>
                <span class="text-xs font-bold">CORRIDA</span>
            </button>
            <button class="profile-action-btn bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center space-y-1" data-action="periodizacao">
                <i data-feather="calendar"></i>
                <span class="text-xs font-bold">PERIODIZAÇÃO</span>
            </button>
            <button class="profile-action-btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center space-y-1" data-action="outdoor">
                <i data-feather="map-pin"></i>
                <span class="text-xs font-bold">OUTDOOR</span>
            </button>
            <button class="profile-action-btn bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center space-y-1" data-action="sono">
                <i data-feather="moon"></i>
                <span class="text-xs font-bold">SONO</span>
            </button>
        `;
        feather.replace();
        renderCalendar();
    }
    
    function renderCalendar() {
        const attendance = database.trainingPlans[currentStudentEmail] && database.trainingPlans[currentStudentEmail].attendance || {};
        const monthYear = document.getElementById("calendar-month-year");
        const grid = document.getElementById("calendar-grid");
        
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        monthYear.textContent = currentCalendarDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        grid.innerHTML = "";
        
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startingDay = firstDay.getDay();
        
        for (let i = 0; i < startingDay; i++) {
            grid.innerHTML += '<div class="calendar-day empty"></div>';
        }
        
        const today = new Date().toISOString().split("T")[0];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const attendanceData = attendance[dateString];
            const isToday = dateString === today;
            
            grid.innerHTML += `<div class="calendar-day ${isToday ? "today" : ""} ${attendanceData ? `treino-${attendanceData.type}` : ""}">${day}</div>`;
        }
    }
    
    function loadTrainingScreen(trainingType) {
        currentTrainingType = trainingType;
        const exercises = [
            { id: 1, name: "Exercício de Força 1", series: "3x10", img: "https://via.placeholder.com/80x80/3b82f6/ffffff?text=E1" },
            { id: 2, name: "Exercício de Força 2", series: "3x12", img: "https://via.placeholder.com/80x80/10b981/ffffff?text=E2" }
        ];
        
        document.getElementById("training-title").textContent = `Treino ${trainingType}`;
        const contentWrapper = document.getElementById("training-content-wrapper");
        
        contentWrapper.innerHTML = exercises.map(exercise => `
            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                <div class="flex items-center">
                    <img src="${exercise.img}" class="w-16 h-16 rounded-lg mr-4">
                    <div>
                        <p class="font-bold text-white">${exercise.name}</p>
                        <p class="text-gray-300 text-sm font-bold">${exercise.series}</p>
                    </div>
                </div>
                <button class="checkin-btn bg-green-600 hover:bg-green-700 text-white font-bold p-3 rounded-lg" data-training-type="${trainingType}">
                    <i data-feather="check"></i>
                </button>
            </div>
        `).join("");
        feather.replace();
    }
    
    function loadRunningScreen() {
        const workouts = database.userRunningWorkouts[currentStudentEmail] || [];
        document.getElementById("training-title").textContent = "Treino de Corrida";
        const contentWrapper = document.getElementById("training-content-wrapper");
        
        if (workouts.length === 0) {
            contentWrapper.innerHTML = '<div class="text-center text-gray-400 font-bold">Nenhum treino de corrida cadastrado.</div>';
        } else {
            contentWrapper.innerHTML = workouts.map(workout => `
                <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <h3 class="font-extrabold text-lg running-title-${workout.method.toLowerCase().replace("ã", "a")}">${workout.method} - ${workout.date}</h3>
                    <p class="text-white my-2"><strong class="font-bold text-gray-400">Detalhes:</strong> ${workout.details}</p>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div><span class="text-gray-400 font-bold">Velocidade:</span> <span class="text-white font-bold">${workout.speed}</span></div>
                        <div><span class="text-gray-400 font-bold">Ritmo:</span> <span class="text-white font-bold">${workout.pace}</span></div>
                        <div><span class="text-gray-400 font-bold">Tempo:</span> <span class="text-white font-bold">${workout.time}</span></div>
                    </div>
                </div>
            `).join("");
        }
    }
    
    function performCheckIn(trainingType) {
        const today = new Date().toISOString().split("T")[0];
        database = DatabaseManager.addTrainingCheckin(currentStudentEmail, today, trainingType, database);
        renderCalendar();
        alert(`Check-in do Treino ${trainingType} realizado com sucesso!`);
    }

    // === EVENT LISTENERS ===
    document.body.addEventListener('click', (e) => {
        // Login - Seleção de usuário
        const userCard = e.target.closest('.user-card');
        if (userCard) {
            populateStudentProfile(userCard.dataset.userEmail);
            showScreen("studentProfileScreen");
            return;
        }
        
        // Lista de alunos
        const studentCard = e.target.closest('.student-card');
        if (studentCard) {
            const student = database.users.find(s => s.id == studentCard.dataset.studentId);
            if (student) {
                populateStudentProfile(student.email);
                showScreen("studentProfileScreen");
            }
            return;
        }
        
        // Navegação
        const navBtn = e.target.closest('.nav-btn, .back-btn');
        if (navBtn) {
            showScreen(navBtn.dataset.target);
            return;
        }
        
        // Ações do perfil
        const actionBtn = e.target.closest('.profile-action-btn');
        if (actionBtn) {
            const action = actionBtn.dataset.action;
            if (action === 'A' || action === 'B') {
                loadTrainingScreen(action);
                showScreen("trainingScreen");
            } else if (action === 'corrida') {
                loadRunningScreen();
                showScreen("trainingScreen");
            } else if (action === 'outdoor') {
                outdoorTracker.initializeOutdoorScreen(database, currentStudentEmail);
                showScreen("outdoorScreen");
            } else if (action === 'sono') {
                sleepTracker.initializeSleepScreen(database, currentStudentEmail);
                showScreen("sleepTrackerScreen");
            }
            return;
        }
        
        // Check-in de treino
        const checkinBtn = e.target.closest('.checkin-btn');
        if (checkinBtn) {
            performCheckIn(checkinBtn.dataset.trainingType);
            return;
        }
        
        // Navegação do calendário
        if (e.target.closest('#prev-month-btn')) {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
        }
        if (e.target.closest('#next-month-btn')) {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
        }
        
        // Outdoor activities
        const outdoorActivityBtn = e.target.closest('.outdoor-activity-btn');
        if (outdoorActivityBtn) {
            outdoorTracker.currentOutdoorActivity = outdoorActivityBtn.dataset.activity;
            document.getElementById("outdoor-selection").classList.add("hidden");
            document.getElementById("outdoorTracker").classList.remove("hidden");
        }
        
        // Controles outdoor
        if (e.target.closest('#outdoorStartButton')) {
            outdoorTracker.startOutdoorTracking();
        }
        if (e.target.closest('#outdoorStopButton')) {
            database = outdoorTracker.stopOutdoorTracking(database, currentStudentEmail);
        }
        
        // Controles do monitor de sono
        if (e.target.closest('#startSleepBtn')) {
            sleepTracker.startSleepTracking();
        }
        if (e.target.closest('#stopSleepBtn')) {
            database = sleepTracker.stopSleepTracking(database, currentStudentEmail);
            sleepTracker.initializeSleepScreen(database, currentStudentEmail);
        }
    });

    // Inicializar aplicação
    initApp();
});
