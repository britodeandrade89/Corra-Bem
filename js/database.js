// database.js - Versão SIMPLIFICADA
console.log('🔮 database.js carregado!');

const DatabaseManager = {
    loadDatabase() {
        console.log('📂 Carregando banco de dados...');
        
        try {
            // Dados mínimos para funcionar
            const initialData = {
                users: [
                    { 
                        id: 1, 
                        name: "André Brito", 
                        email: "britodeandrade@gmail.com", 
                        photo: "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/WsTwhcQeE99iAkUHmCmn/pub/3Zy4n6ZmWp9DW98VtXpO.jpeg",
                        level: "Avançado"
                    },
                    { 
                        id: 2, 
                        name: "Marcelly Bispo", 
                        email: "marcellybispo92@gmail.com", 
                        photo: "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/WsTwhcQeE99iAkUHmCmn/pub/2VWhNV4eSyDNkwEzPGvq.jpeg",
                        level: "Intermediário"
                    }
                ]
            };
            
            console.log('✅ Banco de dados carregado com sucesso');
            return initialData;
            
        } catch (error) {
            console.error('❌ Erro ao carregar banco:', error);
            return { users: [] };
        }
    },
    
    saveDatabase(data) {
        console.log('💾 Salvando banco...');
        // Implementação simples
        localStorage.setItem("abfit_outdoor_database", JSON.stringify(data));
    }
};

console.log('✅ DatabaseManager inicializado');
