// === MONITOR DE SONO ESTILO SAMSUNG HEALTH ===
function initializeSleepScreen() {
    document.getElementById('sleep-tracker-controls').style.display = 'block';
    document.getElementById('sleep-tracker-active').classList.add('hidden');
    document.getElementById('sleepDuration').textContent = '00:00:00';
    document.getElementById('sleepMovements').textContent = '0';
    document.getElementById('sleepNoises').textContent = '0';
    noiseCount = 0;
    movementCount = 0;
    
    // Gerar análise simulada estilo Samsung Health
    generateSleepAnalysis();
    renderSleepHistory();
}

function generateSleepAnalysis() {
    // Esta função simula os dados que seriam coletados pelos sensores
    // Em uma implementação real, esses dados viriam dos sensores
    const sleepScore = Math.floor(Math.random() * 30) + 70; // 70-100
    const sleepDuration = "7h 30min";
    const factors = {
        sleepTime: getRandomQuality(),
        consistency: getRandomQuality(),
        regularity: getRandomQuality(),
        bedtime: getRandomQuality(),
        activity: getRandomQuality(),
        activityConsistency: getRandomQuality(),
        heartRate: getRandomQuality(),
        hrv: getRandomQuality()
    };
    
    // Atualizar a UI com os dados simulados
    updateSleepAnalysisUI(sleepScore, sleepDuration, factors);
}

function getRandomQuality() {
    const qualities = ['Excelente', 'Bom', 'Razoável', 'Ruim'];
    return qualities[Math.floor(Math.random() * qualities.length)];
}

function updateSleepAnalysisUI(score, duration, factors) {
    // Atualizar pontuação principal
    document.querySelector('.text-7xl').textContent = score.toFixed(1);
    
    // Atualizar qualidade baseada na pontuação
    let qualityText, qualityClass;
    if (score >= 85) {
        qualityText = "Excelente";
        qualityClass = "text-emerald-400";
    } else if (score >= 75) {
        qualityText = "Bom";
        qualityClass = "text-green-400";
    } else if (score >= 65) {
        qualityText = "Razoável";
        qualityClass = "text-yellow-400";
    } else {
        qualityText = "Ruim";
        qualityClass = "text-red-400";
    }
    
    document.querySelector('.text-blue-300').textContent = qualityText;
    document.querySelector('.text-blue-300').className = `text-lg font-bold ${qualityClass}`;
    
    // Atualizar fatores individuais
    updateSleepFactors(factors);
}

function updateSleepFactors(factors) {
    const factorElements = document.querySelectorAll('.flex.justify-between.items-center');
    factorElements.forEach((element, index) => {
        const spans = element.querySelectorAll('span');
        if (spans.length === 2) {
            const quality = Object.values(factors)[index];
            let colorClass;
            
            switch(quality) {
                case 'Excelente': colorClass = 'text-emerald-400'; break;
                case 'Bom': colorClass = 'text-green-400'; break;
                case 'Razoável': colorClass = 'text-yellow-400'; break;
                default: colorClass = 'text-red-400';
            }
            
            spans[1].textContent = quality;
            spans[1].className = `${colorClass} text-sm font-bold`;
        }
    });
}

async function startSleepTracking() {
    try {
        // 1. Pedir permissão e capturar áudio
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // 2. Iniciar monitoramento de movimento
        motionListener = (event) => {
            const { x, y, z } = event.accelerationIncludingGravity;
            const acceleration = Math.sqrt(x*x + y*y + z*z);
            
            // Detectar movimentos (valor > 12 indica movimento significativo)
            if (acceleration > 12) {
                movementCount++;
                document.getElementById('sleepMovements').textContent = movementCount;
                
                // Atualizar análise em tempo real
                updateRealTimeAnalysis();
            }
        };
        window.addEventListener('devicemotion', motionListener);

        // 3. Iniciar interface de monitoramento
        sleepStartTime = Date.now();
        document.getElementById('sleep-tracker-controls').style.display = 'none';
        document.getElementById('sleep-tracker-active').classList.remove('hidden');
        document.getElementById('sleep-tracker-active').classList.add('sleep-monitoring-active');

        // 4. Timer principal
        sleepTimerInterval = setInterval(() => {
            const diff = Math.floor((Date.now() - sleepStartTime) / 1000);
            const h = String(Math.floor(diff / 3600)).padStart(2, '0');
            const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
            const s = String(diff % 60).padStart(2, '0');
            document.getElementById('sleepDuration').textContent = `${h}:${m}:${s}`;
            
            // Análise de áudio em tempo real
            analyser.getByteFrequencyData(dataArray);
            let sum = dataArray.reduce((a, b) => a + b, 0);
            let average = sum / bufferLength;
            
            // Atualizar medidor de volume
            document.getElementById('volumeBar').style.width = `${Math.min(average, 100)}%`;
            
            // Detectar ruídos (picos de áudio)
            if (average > 50) {
                noiseCount++;
                document.getElementById('sleepNoises').textContent = noiseCount;
                updateRealTimeAnalysis();
            }
        }, 500);

    } catch (err) {
        alert('Erro ao acessar microfone ou sensores. Por favor, conceda a permissão.');
        console.error(err);
    }
}

function updateRealTimeAnalysis() {
    // Atualizar a análise com base nos dados em tempo real
    const realTimeScore = calculateRealTimeScore();
    const factors = calculateRealTimeFactors();
    updateSleepAnalysisUI(realTimeScore, document.getElementById('sleepDuration').textContent, factors);
}

function calculateRealTimeScore() {
    // Calcular pontuação em tempo real baseada nos sensores
    let score = 80; // Base
    
    // Penalizar por movimentos (máx 20 pontos)
    score -= Math.min(movementCount * 0.5, 20);
    
    // Penalizar por ruídos (máx 15 pontos)
    score -= Math.min(noiseCount * 0.3, 15);
    
    // Garantir que está entre 0-100
    return Math.max(0, Math.min(100, score));
}

function calculateRealTimeFactors() {
    // Calcular fatores em tempo real
    return {
        sleepTime: movementCount < 10 ? 'Bom' : 'Razoável',
        consistency: noiseCount < 5 ? 'Excelente' : 'Bom',
        regularity: movementCount < 15 ? 'Bom' : 'Razoável',
        bedtime: 'Bom',
        activity: movementCount > 20 ? 'Razoável' : 'Bom',
        activityConsistency: 'Bom',
        heartRate: noiseCount < 3 ? 'Excelente' : 'Bom',
        hrv: movementCount < 8 ? 'Excelente' : 'Bom'
    };
}

function stopSleepTracking() {
    // Parar todos os timers e listeners
    clearInterval(sleepTimerInterval);
    window.removeEventListener('devicemotion', motionListener);
    
    if (microphone) {
        microphone.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    if (audioContext) {
        audioContext.close();
    }

    // Salvar análise final
    const finalScore = calculateRealTimeScore();
    const sleepRecord = {
        date: new Date().toISOString(),
        duration: document.getElementById('sleepDuration').textContent,
        score: finalScore,
        movements: movementCount,
        noises: noiseCount,
        factors: calculateRealTimeFactors()
    };
    
    // Salvar no banco de dados
    if (!database.sleepHistory) database.sleepHistory = {};
    if (!database.sleepHistory[currentStudentEmail]) database.sleepHistory[currentStudentEmail] = [];
    database.sleepHistory[currentStudentEmail].push(sleepRecord);
    saveDatabase();

    // Recarregar a tela com os novos dados
    initializeSleepScreen();
}

function renderSleepHistory() {
    const historyContainer = document.getElementById('sleepHistoryList');
    const history = (database.sleepHistory && database.sleepHistory[currentStudentEmail]) || [];
    
    if (history.length === 0) {
        // Mostrar dados de exemplo
        historyContainer.innerHTML = `
            <div class="flex justify-between items-center p-3 bg-gray-800 rounded-xl">
                <div>
                    <p class="text-white font-bold">Ontem</p>
                    <p class="text-gray-400 text-sm">7h 15min • 74,2 pontos</p>
                </div>
                <div class="text-right">
                    <span class="text-green-400 text-sm font-bold">Bom</span>
                    <p class="text-gray-400 text-sm">12 movimentos</p>
                </div>
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = history.slice().reverse().map(record => {
        let qualityClass, qualityText;
        if (record.score >= 85) {
            qualityClass = "text-emerald-400";
            qualityText = "Excelente";
        } else if (record.score >= 75) {
            qualityClass = "text-green-400";
            qualityText = "Bom";
        } else if (record.score >= 65) {
            qualityClass = "text-yellow-400";
            qualityText = "Razoável";
        } else {
            qualityClass = "text-red-400";
            qualityText = "Ruim";
        }
        
        return `
            <div class="sleep-history-item flex justify-between items-center p-3 bg-gray-800 rounded-xl border border-gray-700">
                <div>
                    <p class="text-white font-bold">${new Date(record.date).toLocaleDateString('pt-BR')}</p>
                    <p class="text-gray-400 text-sm">${record.duration} • ${record.score.toFixed(1)} pontos</p>
                </div>
                <div class="text-right">
                    <span class="${qualityClass} text-sm font-bold">${qualityText}</span>
                    <p class="text-gray-400 text-sm">${record.movements} movimentos</p>
                </div>
            </div>
        `;
    }).join('');
}
