// sleep-tracker.js - Monitoramento avançado de sono

class SleepTracker {
    constructor() {
        this.sleepStartTime = null;
        this.sleepTimerInterval = null;
        this.audioContext = null;
        this.microphone = null;
        this.analyser = null;
        this.motionListener = null;
        this.noiseCount = 0;
        this.movementCount = 0;
        this.snoringCount = 0;
        this.sleepPhases = { rem: 0, light: 0, deep: 0, awake: 0 };
        this.sleepPhaseTimer = null;
        this.currentPhase = 'awake';
        this.chart = null;
        this.isTracking = false;
    }

    // Inicializar tela de sono
    initializeSleepScreen(database, currentStudentEmail) {
        document.getElementById('sleep-tracker-controls').style.display = 'block';
        document.getElementById('sleep-tracker-active').classList.add('hidden');
        document.getElementById('sleepDuration').textContent = '00:00:00';
        document.getElementById('sleepMovements').textContent = '0';
        document.getElementById('sleepNoises').textContent = '0';
        document.getElementById('sleepSnoring').textContent = '0';
        document.getElementById('sleepQuality').textContent = 'Excelente';
        document.getElementById('sleepQuality').className = 'text-xl font-bold sleep-quality-excellent';
        
        this.resetSleepPhases();
        this.updateSleepPhaseDisplay();
        
        this.noiseCount = 0;
        this.movementCount = 0;
        this.snoringCount = 0;
        
        this.renderSleepHistory(database, currentStudentEmail);
        this.updateSleepStatistics(database, currentStudentEmail);
    }
    
    resetSleepPhases() {
        this.sleepPhases = { rem: 0, light: 0, deep: 0, awake: 0 };
        this.currentPhase = 'awake';
    }
    
    updateSleepPhaseDisplay() {
        const total = this.sleepPhases.rem + this.sleepPhases.light + this.sleepPhases.deep + this.sleepPhases.awake;
        
        if (total === 0) {
            document.getElementById('rem-percentage').textContent = '0%';
            document.getElementById('light-percentage').textContent = '0%';
            document.getElementById('deep-percentage').textContent = '0%';
            document.getElementById('awake-percentage').textContent = '0%';
            return;
        }
        
        document.getElementById('rem-percentage').textContent = Math.round((this.sleepPhases.rem / total) * 100) + '%';
        document.getElementById('light-percentage').textContent = Math.round((this.sleepPhases.light / total) * 100) + '%';
        document.getElementById('deep-percentage').textContent = Math.round((this.sleepPhases.deep / total) * 100) + '%';
        document.getElementById('awake-percentage').textContent = Math.round((this.sleepPhases.awake / total) * 100) + '%';
    }
    
    updateSleepQuality() {
        const totalDuration = this.sleepPhases.rem + this.sleepPhases.light + this.sleepPhases.deep + this.sleepPhases.awake;
        if (totalDuration === 0) return 100;
        
        const deepSleepRatio = this.sleepPhases.deep / totalDuration;
        const awakeRatio = this.sleepPhases.awake / totalDuration;
        const movementRatio = this.movementCount / (totalDuration / 60);
        const noiseRatio = this.noiseCount / (totalDuration / 60);
        
        let qualityScore = 100;
        
        // Penalizações baseadas em fatores que afetam a qualidade do sono
        qualityScore -= awakeRatio * 40;
        qualityScore -= (1 - deepSleepRatio) * 20;
        qualityScore -= Math.min(movementRatio * 5, 20);
        qualityScore -= Math.min(noiseRatio * 3, 15);
        
        qualityScore = Math.max(0, Math.min(100, qualityScore));
        
        let qualityText, qualityClass;
        
        if (qualityScore >= 80) {
            qualityText = "Excelente";
            qualityClass = "sleep-quality-excellent";
        } else if (qualityScore >= 60) {
            qualityText = "Boa";
            qualityClass = "sleep-quality-good";
        } else if (qualityScore >= 40) {
            qualityText = "Regular";
            qualityClass = "sleep-quality-fair";
        } else {
            qualityText = "Ruim";
            qualityClass = "sleep-quality-poor";
        }
        
        document.getElementById('sleepQuality').textContent = qualityText;
        document.getElementById('sleepQuality').className = `text-xl font-bold ${qualityClass}`;
        
        return qualityScore;
    }
    
    simulateSleepPhase() {
        const elapsedMinutes = Math.floor((Date.now() - this.sleepStartTime) / 60000);
        
        if (elapsedMinutes < 5) {
            this.currentPhase = 'awake';
        } else if (elapsedMinutes < 20) {
            this.currentPhase = 'light';
        } else if (elapsedMinutes % 90 < 10) {
            this.currentPhase = 'rem';
        } else if (elapsedMinutes % 90 < 60) {
            this.currentPhase = 'light';
        } else {
            this.currentPhase = 'deep';
        }
        
        if (this.movementCount > 5 && elapsedMinutes > 10) {
            const movementRate = this.movementCount / elapsedMinutes;
            if (movementRate > 0.3) {
                this.currentPhase = 'awake';
            } else if (movementRate > 0.1) {
                this.currentPhase = 'light';
            }
        }
        
        this.sleepPhases[this.currentPhase]++;
        this.updateSleepPhaseDisplay();
        this.updateSleepQuality();
    }

    // Iniciar monitoramento de sono
    async startSleepTracking() {
        if (this.isTracking) return;
        
        try {
            // Solicitar permissões
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Configurar monitoramento de movimento
            if (window.DeviceMotionEvent) {
                this.motionListener = (event) => {
                    const { x, y, z } = event.accelerationIncludingGravity;
                    const acceleration = Math.sqrt(x*x + y*y + z*z);
                    
                    if (acceleration > 12) {
                        this.movementCount++;
                        document.getElementById('sleepMovements').textContent = this.movementCount;
                    }
                };
                window.addEventListener('devicemotion', this.motionListener);
            }

            // Iniciar interface
            this.sleepStartTime = Date.now();
            this.isTracking = true;
            document.getElementById('sleep-tracker-controls').style.display = 'none';
            document.getElementById('sleep-tracker-active').classList.remove('hidden');
            document.getElementById('sleep-tracker-active').classList.add('sleep-tracking-active');

            // Timer principal
            this.sleepTimerInterval = setInterval(() => {
                const diff = Math.floor((Date.now() - this.sleepStartTime) / 1000);
                const h = String(Math.floor(diff / 3600)).padStart(2, '0');
                const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
                const s = String(diff % 60).padStart(2, '0');
                document.getElementById('sleepDuration').textContent = `${h}:${m}:${s}`;
                
                // Análise de áudio
                this.analyser.getByteFrequencyData(dataArray);
                let sum = dataArray.reduce((a, b) => a + b, 0);
                let average = sum / bufferLength;
                document.getElementById('volumeBar').style.width = `${Math.min(average, 100)}%`;
                
                if (average > 50) {
                    this.noiseCount++;
                    document.getElementById('sleepNoises').textContent = this.noiseCount;
                    
                    // Detecção de ronco (frequências baixas)
                    const lowFreqAvg = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
                    if (lowFreqAvg > 70 && average > 60) {
                        this.snoringCount++;
                        document.getElementById('sleepSnoring').textContent = this.snoringCount;
                    }
                }
            }, 500);
            
            // Timer para fases do sono
            this.sleepPhaseTimer = setInterval(() => this.simulateSleepPhase(), 60000);

        } catch (err) {
            alert('Erro ao acessar microfone ou sensores. Por favor, conceda a permissão.');
            console.error(err);
        }
    }

    // Parar monitoramento de sono
    stopSleepTracking(database, currentStudentEmail) {
        if (!this.isTracking) return;
        
        // Parar timers e listeners
        clearInterval(this.sleepTimerInterval);
        clearInterval(this.sleepPhaseTimer);
        
        if (this.motionListener) {
            window.removeEventListener('devicemotion', this.motionListener);
        }
        
        if (this.microphone) {
            this.microphone.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }

        // Calcular qualidade final
        const qualityScore = this.updateSleepQuality();
        
        // Salvar registro
        const totalSeconds = Math.floor((Date.now() - this.sleepStartTime) / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const durationFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const sleepRecord = {
            date: new Date().toISOString(),
            duration: durationFormatted,
            durationSeconds: totalSeconds,
            movements: this.movementCount,
            noises: this.noiseCount,
            snoring: this.snoringCount,
            quality: qualityScore,
            phases: { ...this.sleepPhases }
        };
        
        DatabaseManager.addSleepRecord(currentStudentEmail, sleepRecord, database);
        this.isTracking = false;

        return database;
    }

    // Renderizar histórico de sono
    renderSleepHistory(database, currentStudentEmail) {
        const historyContainer = document.getElementById('sleepHistoryList');
        const history = DatabaseManager.getSleepHistory(currentStudentEmail, database);
        
        if (history.length === 0) {
            historyContainer.innerHTML = '<p class="text-gray-400 text-center font-bold">Nenhum registro de sono.</p>';
            return;
        }
        
        historyContainer.innerHTML = history.slice().reverse().map(record => {
            const date = new Date(record.date);
            const dateStr = date.toLocaleDateString('pt-BR');
            const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            let qualityClass, qualityText;
            if (record.quality >= 80) {
                qualityClass = "sleep-quality-excellent";
                qualityText = "Excelente";
            } else if (record.quality >= 60) {
                qualityClass = "sleep-quality-good";
                qualityText = "Boa";
            } else if (record.quality >= 40) {
                qualityClass = "sleep-quality-fair";
                qualityText = "Regular";
            } else {
                qualityClass = "sleep-quality-poor";
                qualityText = "Ruim";
            }
            
            return `
                <div class="sleep-stat-card p-3 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-bold text-white">${dateStr}</h4>
                        <span class="text-gray-400 text-sm font-bold">${timeStr}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div><span class="text-gray-400 font-bold">Duração:</span> <span class="text-white font-bold">${record.duration}</span></div>
                        <div><span class="text-gray-400 font-bold">Qualidade:</span> <span class="font-bold ${qualityClass}">${qualityText}</span></div>
                        <div><span class="text-gray-400 font-bold">Movimentos:</span> <span class="text-white font-bold">${record.movements}</span></div>
                        <div><span class="text-gray-400 font-bold">Roncos:</span> <span class="text-white font-bold">${record.snoring}</span></div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Atualizar estatísticas de sono
    updateSleepStatistics(database, currentStudentEmail) {
        const history = DatabaseManager.getSleepHistory(currentStudentEmail, database);
        
        if (history.length === 0) {
            document.getElementById('avgDuration').textContent = '--:--';
            document.getElementById('avgQuality').textContent = '--';
            document.getElementById('avgQuality').className = 'text-xl font-bold sleep-quality-excellent';
            return;
        }
        
        // Calcular média de duração
        const totalSeconds = history.reduce((sum, record) => sum + record.durationSeconds, 0);
        const avgSeconds = totalSeconds / history.length;
        const avgHours = Math.floor(avgSeconds / 3600);
        const avgMinutes = Math.floor((avgSeconds % 3600) / 60);
        document.getElementById('avgDuration').textContent = `${String(avgHours).padStart(2, '0')}:${String(avgMinutes).padStart(2, '0')}`;
        
        // Calcular qualidade média
        const avgQuality = history.reduce((sum, record) => sum + record.quality, 0) / history.length;
        let qualityClass, qualityText;
        
        if (avgQuality >= 80) {
            qualityClass = "sleep-quality-excellent";
            qualityText = "Excelente";
        } else if (avgQuality >= 60) {
            qualityClass = "sleep-quality-good";
            qualityText = "Boa";
        } else if (avgQuality >= 40) {
            qualityClass = "sleep-quality-fair";
            qualityText = "Regular";
        } else {
            qualityClass = "sleep-quality-poor";
            qualityText = "Ruim";
        }
        
        document.getElementById('avgQuality').textContent = qualityText;
        document.getElementById('avgQuality').className = `text-xl font-bold ${qualityClass}`;
        
        // Atualizar gráfico
        this.updateSleepTrendChart(history);
    }
    
    // Atualizar gráfico de tendências
    updateSleepTrendChart(history) {
        const ctx = document.getElementById('sleepTrendChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        const recentHistory = history.slice(-7);
        const labels = recentHistory.map(record => {
            const date = new Date(record.date);
            return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
        });
        
        const qualityData = recentHistory.map(record => record.quality);
        const durationData = recentHistory.map(record => record.durationSeconds / 3600);
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Qualidade do Sono (%)',
                        data: qualityData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        yAxisID: 'y',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Duração (horas)',
                        data: durationData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        yAxisID: 'y1',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#9ca3af' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#9ca3af' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#9ca3af' }
                    },
                },
                plugins: {
                    legend: {
                        labels: { color: '#9ca3af' }
                    }
                }
            }
        });
    }
}
