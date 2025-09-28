// database.js - Gerenciamento de dados do aplicativo

const DatabaseManager = {
    // Carregar dados do localStorage
    loadDatabase() {
        console.log('📂 Carregando banco de dados...');
        try {
            const stored = localStorage.getItem("abfit_outdoor_database");
            if (stored) {
                console.log('✅ Banco encontrado no localStorage');
                return JSON.parse(stored);
            } else {
                console.log('🆕 Criando novo banco de dados...');
                // Dados iniciais
                const initialData = {
                    users: [
                        { 
                            id: 1, 
                            name: "André Brito", 
                            email: "britodeandrade@gmail.com", 
                            photo: "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/WsTwhcQeE99iAkUHmCmn/pub/3Zy4n6ZmWp9DW98VtXpO.jpeg",
                            level: "Avançado",
                            joinDate: "2024-01-15"
                        },
                        { 
                            id: 2, 
                            name: "Marcelly Bispo", 
                            email: "marcellybispo92@gmail.com", 
                            photo: "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/WsTwhcQeE99iAkUHmCmn/pub/2VWhNV4eSyDNkwEzPGvq.jpeg",
                            level: "Intermediário",
                            joinDate: "2024-02-10"
                        },
                        { 
                            id: 3, 
                            name: "Marcia Brito", 
                            email: "andrademarcia.ucam@gmail.com", 
                            photo: "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/WsTwhcQeE99iAkUHmCmn/pub/huS3I3wDTHbXGY1EuLjf.jpg",
                            level: "Iniciante",
                            joinDate: "2024-03-05"
                        },
                        { 
                            id: 4, 
                            name: "Liliane Torres", 
                            email: "lilicatorres@gmail.com", 
                            photo: "https://i.ibb.co/7j6x0gG/liliane-torres.jpg",
                            level: "Intermediário",
                            joinDate: "2024-01-20"
                        }
                    ],
                    trainingPlans: {},
                    userRunningWorkouts: {
                        'britodeandrade@gmail.com': [
                            { date: "26/9", method: "FARTLEK", details: "5' AQ + 20' CO alternado entre CA : CO + 5' REC", speed: "8,5 Km/h", pace: "7:00/Km", time: "30 min" }
                        ]
                    },
                    outdoorWorkouts: {},
                    sleepHistory: {},
                    appSettings: {
                        theme: "dark",
                        notifications: true,
                        autoSave: true
                    }
                };
                
                // Inicializar estruturas para cada usuário
                initialData.users.forEach(user => {
                    initialData.trainingPlans[user.email] = initialData.trainingPlans[user.email] || { 
                        A: [], 
                        B: [], 
                        periodizacao: [], 
                        attendance: {} 
                    };
                    initialData.outdoorWorkouts[user.email] = initialData.outdoorWorkouts[user.email] || [];
                    initialData.sleepHistory[user.email] = initialData.sleepHistory[user.email] || [];
                });
                
                this.saveDatabase(initialData);
                console.log('✅ Novo banco criado com sucesso');
                return initialData;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar banco:', error);
            // Retornar estrutura vazia em caso de erro
            return { users: [], trainingPlans: {}, outdoorWorkouts: {}, sleepHistory: {} };
        }
    },
    
    // Salvar dados no localStorage
    saveDatabase(data) {
        try {
            localStorage.setItem("abfit_outdoor_database", JSON.stringify(data));
            console.log('💾 Banco salvo com sucesso');
        } catch (error) {
            console.error('❌ Erro ao salvar banco:', error);
        }
    },
    
    // Obter usuário por email
    getUserByEmail(email, database) {
        return database.users.find(user => user.email === email);
    },
    
    // Adicionar registro de sono
    addSleepRecord(email, record, database) {
        if (!database.sleepHistory) database.sleepHistory = {};
        if (!database.sleepHistory[email]) {
            database.sleepHistory[email] = [];
        }
        database.sleepHistory[email].push(record);
        this.saveDatabase(database);
        return database;
    },
    
    // Obter histórico de sono
    getSleepHistory(email, database) {
        return database.sleepHistory && database.sleepHistory[email] || [];
    }
};
