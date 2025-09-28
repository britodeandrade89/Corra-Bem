// app.js - Versão SIMPLIFICADA para diagnóstico

console.log('🔮 app.js carregado!');

// Versão mínima funcionando
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ app.js: DOM Content Loaded');
    
    // Estado global simples
    let currentStudentEmail = null;
    
    // Função para mostrar telas
    function showScreen(screenId) {
        console.log('🔄 Mudando para tela:', screenId);
        
        // Esconder todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar tela alvo
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }
    
    // Configurar event listeners básicos
    document.addEventListener('click', function(e) {
        // Login de usuário
        if (e.target.closest('.user-card')) {
            const userCard = e.target.closest('.user-card');
            currentStudentEmail = userCard.dataset.userEmail;
            
            // Aqui você mostraria o perfil do aluno
            alert('Login realizado! Email: ' + currentStudentEmail);
            console.log('👤 Usuário logado:', currentStudentEmail);
        }
        
        // Botão voltar
        if (e.target.closest('.back-btn')) {
            const backBtn = e.target.closest('.back-btn');
            showScreen(backBtn.dataset.target);
        }
    });
    
    console.log('🚀 app.js inicializado com sucesso!');
});
