// app.js - Aplicação principal AB Fit Outdoor

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔮 DOM Carregado - Iniciando AB Fit Outdoor...');

    // === ESTADO GLOBAL ===
    let database = {};
    let currentStudentEmail = null;
    let currentCalendarDate = new Date();
    let currentTrainingType = null;
    
    // Instâncias dos módulos
    const sleepTracker = new SleepTracker();
    const outdoorTracker = new OutdoorTracker();

    // === FUNÇÕES PRINCIPAIS ===
    function showScreen(screenId) {
        console.log('🔄 Mudando para tela:', screenId);
        document.querySelectorAll(".screen").forEach(screen => {
            screen.classList.remove("active");
        });
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add("active");
        }
        
        // Mostrar/ocultar navegação inferior
        const bottomNav = document.getElementById("bottom-nav");
        if (bottomNav) {
            bottomNav.style.display = screenId === "loginScreen" ? "none" : "flex";
        }
        
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
        console.log('👥 Populando seleção de usuários...');
        const container = document.getElementById("user-selection-container");
        if (!container) {
            console.error('❌ Container de seleção de usuários não encontrado');
            return;
        }
        
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
        console.log('📚 Populando lista de alunos...');
        const container = document.getElementById("student-list-container");
        if (!container) {
            console.error('❌ Container da lista de alunos não encontrado');
            return;
        }
        
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
        console.log('👤 Carregando perfil:', studentEmail);
        currentStudentEmail = studentEmail;
        const student = database.users.find(s => s.email === studentEmail);
        if (!student) {
            console.error('❌ Aluno não encontrado:', studentEmail);
            return;
        }

        const profileInfo = document.getElementById('student-profile-info');
        if (profileInfo) {
            profileInfo.innerHTML = `
                <div class="flex items-center mb-6">
                    <img src="${student.photo}" alt="${student.name}" class="w-20 h-20 rounded-full object-cover mr-4 border-2 border-gray-600">
                    <div>
                        <h1 class="text-2xl font-bold text-white">${student.name}</h1>
                        <p class="text-gray-400 font-bold">${student.email}</p>
                        <p class="text-gray-500 text-sm font-bold">${student.level} • Desde ${new Date(student.joinDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
            `;
        }
        
        const profileButtons = document.getElementById('student-profile-buttons');
        if (profileButtons) {
            profileButtons.innerHTML = `
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
        }
        
        renderCalendar();
    }
    
    function renderCalendar() {
        console.log('📅 Renderizando calendário...');
        const attendance = database.trainingPlans[currentStudentEmail] && database.trainingPlans[currentStudentEmail].attendance || {};
        const monthYear = document.getElementById("calendar-month-year");
        const grid = document.getElementById("calendar-grid");
        
        if (!monthYear || !grid) {
            console.error('❌ Elementos do calendário não encontrados');
            return;
        }
        
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

    // === INICIALIZAÇÃO CORRIGIDA ===
    function initApp() {
        console.log('🎯 Inicializando aplicação...');
        
        try {
            // 1. Carregar banco de dados
            database = DatabaseManager.loadDatabase();
            console.log('✅ Banco de dados carregado:', database);
            
            // 2. Inicializar Feather Icons
            feather.replace();
            console.log('✅ Feather Icons inicializado');
            
            // 3. Aguardar um pouco para mostrar a splash screen
            setTimeout(() => {
                const splashScreen = document.getElementById("splashScreen");
                const appContainer = document.getElementById("appContainer");
                
                if (!splashScreen || !appContainer) {
                    console.error('❌ Elementos principais não encontrados');
                    return;
                }
                
                console.log('🔄 Transicionando para aplicação...');
                
                // Efeito de fade out na splash
                splashScreen.classList.add("fade-out");
                
                setTimeout(() => {
                    // Esconder splash e mostrar app
                    splashScreen.style.display = "none";
                    appContainer.style.display = "flex";
                    appContainer.classList.remove("hidden");
                    
                    // Inicializar componentes
                    populateUserSelection();
                    populateStudentList();
                    showScreen("loginScreen");
                    
                    console.log('🚀 AB Fit Outdoor carregado com sucesso!');
                    console.log('📊 Estatísticas:', {
                        usuarios: database.users.length,
                        treinos: Object.keys(database.trainingPlans).length,
                        historicoSono: Object.keys(database.sleepHistory || {}).length
                    });
                    
                }, 800); // Tempo do fade out
                
            }, 2500); // Tempo mínimo da splash screen
            
        } catch (error) {
            console.error('💥 ERRO CRÍTICO na inicialização:', error);
            
            // Fallback de emergência
            const splashScreen = document.getElementById("splashScreen");
            const appContainer = document.getElementById("appContainer");
            
            if (splashScreen) splashScreen.style.display = "none";
            if (appContainer) {
                appContainer.style.display = "flex";
                appContainer.classList.remove("hidden");
                showScreen("loginScreen");
            }
            
            alert('Erro ao carregar o aplicativo. Recarregue a página.');
        }
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
                currentTrainingType = action;
                showScreen("trainingScreen");
            } else if (action === 'corrida') {
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
        
        // Controles do monitor de sono
        if (e.target.closest('#startSleepBtn')) {
            sleepTracker.startSleepTracking();
        }
        if (e.target.closest('#stopSleepBtn')) {
            database = sleepTracker.stopSleepTracking(database, currentStudentEmail);
            sleepTracker.initializeSleepScreen(database, currentStudentEmail);
        }
    });

    // Inicializar aplicação quando tudo estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
});
