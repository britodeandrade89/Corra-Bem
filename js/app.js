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
        console.log('🚀 Iniciando AB Fit Outdoor...');
        feather.replace();
        
        try {
            database = DatabaseManager.loadDatabase();
            console.log('✅ Banco de dados carregado:', database);
            
            const splashScreen = document.getElementById("splashScreen");
            const appContainer = document.getElementById("appContainer");
            
            if (!splashScreen || !appContainer) {
                console.error('❌ Elementos da interface não encontrados');
                return;
            }
            
            setTimeout(() => {
                console.log('🎬 Transicionando para app...');
                splashScreen.classList.add("fade-out");
                
                setTimeout(() => {
                    splashScreen.style.display = "none";
                    appContainer.style.display = "flex";
                    appContainer.classList.remove("hidden");
                    
                    // Inicializar componentes
                    populateUserSelection();
                    populateStudentList();
                    showScreen("loginScreen");
                    
                    console.log('✅ App carregado com sucesso!');
                }, 800); // Aumentei um pouco o tempo para smooth transition
                
            }, 2200); // Tempo suficiente para mostrar a nova splash screen
            
        } catch (error) {
            console.error('❌ Erro ao inicializar app:', error);
            // Fallback: mostrar tela de login mesmo com erro
            const splashScreen = document.getElementById("splashScreen");
            const appContainer = document.getElementById("appContainer");
            
            if (splashScreen && appContainer) {
                splashScreen.style.display = "none";
                appContainer.style.display = "flex";
                appContainer.classList.remove("hidden");
                showScreen("loginScreen");
            }
        }
    }

    // ... RESTANTE DO CÓDIGO PERMANECE IGUAL ...
    // (populateUserSelection, populateStudentList, showScreen, etc.)

    // Inicializar aplicação
    initApp();
});