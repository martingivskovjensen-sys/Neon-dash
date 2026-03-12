m// Neon Dash - Core Game Script
// Vanilla JS, HTML5 Canvas, Web Audio API

class NeonDash {
    constructor() {
        // Leaderboard vars
        this.username = localStorage.getItem('neonDashUser') || '';
        this.db = null;
        this.leaderboardUnsub = null;
        this.allScoresUnsub = null;
        this.isAdmin = false; // Code-based now
        this.adminLoggedIn = false;
        this.adminPassword = 'neondash_admin_2024'; // Change this!
        this.leaderboardEnabled = true;
        this.timerEndTime = 0;
        this.topScores = [];

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.uiOverlay = document.getElementById('uiOverlay');
        this.container = document.getElementById('gameContainer');

        // Firebase init
        this.initFirebase();

        // Admin panel
        if (this.isAdmin) {
            document.getElementById('adminPanel').classList.remove('hidden');
        }

        this.setupLeaderBoardUI();
        this.setupAdminUI();
        document.getElementById('usernameModal').classList.add('show');
        document.getElementById('startBtn').onclick = () => document.getElementById('usernameModal').classList.add('show');
    }

    initFirebase() {
        // REPLACE WITH YOUR FIREBASE CONFIG from console.firebase.google.com
        const firebaseConfig = {
            apiKey: "your-api-key",
            authDomain: "your-project.firebaseapp.com",
            projectId: "your-project-id",
            storageBucket: "your-project.appspot.com",
            messagingSenderId: "123",
            appId: "your-app-id"
        };
        
        if (window.firebaseModules) {
            const { initializeApp, getFirestore } = window.firebaseModules;
            const app = initializeApp(firebaseConfig);
            this.db = getFirestore(app);
            console.log('Firebase ready');
        } else {
            console.warn('Firebase not loaded');
            this.db = null;
        }
    }

    setupLeaderBoardUI() {
        if (!this.db) {
            document.getElementById('leaderboardList').innerHTML = '<li>No Firebase</li>';
            return;
        }
        // Realtime top 10 listener added later
        this.updateLeaderboardUI();
    }

    setupAdminUI() {
        if (!this.isAdmin) return;
        
        document.getElementById('adminLogin').onclick = () => {
            const pass = document.getElementById('adminPassword').value;
            if (pass === this.adminPassword) {
                this.adminLoggedIn = true;
                document.getElementById('adminContent').classList.remove('hidden');
                document.getElementById('adminPanel').classList.add('show');
            } else {
                alert('Wrong password');
            }
        };

        document.getElementById('startTimer').onclick = () => {
            const seconds = parseInt(document.getElementById('timerInput').value);
            this.timerEndTime = Date.now() + seconds * 1000;
            this.leaderboardEnabled = true;
        };
        document.getElementById('stopTimer').onclick = () => {
            this.leaderboardEnabled = false;
            this.timerEndTime = 0;
        };
    }

    // Username logic
    document.getElementById('submitUsername').onclick = async () => {
        const name = document.getElementById('usernameInput').value.trim();
        if (!name || name.length < 2) {
            document.getElementById('usernameError').textContent = 'Name too short!';
            return;
        }

        if (this.db) {
            // Check unique (simple query)
            const snapshot = await this.db.collection('scores').where('username', '==', name).get();
            if (!snapshot.empty) {
                document.getElementById('usernameError').textContent = 'Username taken!';
                return;
            }
        }

        this.username = name;
        localStorage.setItem('neonDashUser', name);
        document.getElementById('usernameModal').classList.remove('show');
        document.getElementById('usernameError').textContent = '';
        this.startGame();
    };

    updateLeaderboardUI() {
        if (!this.topScores.length) {
            document.getElementById('leaderboardList').innerHTML = '<li>Loading...</li>';
            return;
        }
        let html = '';
        this.topScores.slice(0,10).forEach((score, i) => {
            html += `<li>${i+1}. ${score.username}: ${score.score}</li>`;
        });
        document.getElementById('leaderboardList').innerHTML = html;
    }

    async submitScore() {
        if (!this.db || !this.leaderboardEnabled || !this.username) return;
        
        try {
            await this.db.collection('scores').add({
                username: this.username,
                score: this.score,
                timestamp: this.gameTime,
                date: new Date().toISOString()
            });
            console.log('Score submitted');
        } catch (e) {
            console.error('Submit failed', e);
        }
    }

    async loadTopScores() {
        if (!this.db) return;
        const snapshot = await this.db.collection('scores')
            .orderBy('score', 'desc')
            .limit(10)
            .get();
        this.topScores = snapshot.docs.map(doc => doc.data());
        this.updateLeaderboardUI();
    }

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

        // Game state
        this.state = 'MENU'; // MENU, PLAYING, GAMEOVER
        this.score = 0;
        this.highScore = localStorage.getItem('neonDashHigh') || 0;
        this.gameSpeed = 1;
        this.gameTime = 0;
        this.timeScale = 1; // for slow-mo powerup

        // Player
        this.player = {
            x: this.width / 2,
            y: this.height / 2,
            vx: 0,
            vy: 0,
            size: 20,
            trail: [] // [{x,y,alpha}]
        };
        this.keys = {};
        this.touchStartX = 0;
        this.touchStartY = 0;

        // Audio
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.audioNodes = {};
        this.bgOsc = null;

        // Particles, obstacles, powerups will be added later
        this.particles = [];
        this.obstacles = [];
        this.powerups = [];
        
        // Obstacles
        this.obstacleSpawnTimer = 0;
        this.nextObstacleTime = 1;
        
        // Powerups
        this.powerupSpawnTimer = 0;
        this.nextPowerupTime = 10; // Rare
        this.shieldTime = 0;
        this.scoreMultiplier = 1;
        this.slowMoTime = 0;
        this.powerupDuration = 5;

        this.resize();
        this.setupEvents();
        this.updateUI();
        this.loop();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        // Reposition player to center if needed
        this.player.x = Math.min(this.player.x, this.width - this.player.size);
        this.player.y = Math.min(this.player.y, this.height - this.player.size);
    }

    setupEvents() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Touch/Mouse for mobile/desktop
        let isDragging = false;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            isDragging = true;
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isDragging) {
                const touch = e.touches[0];
                const dx = touch.clientX - this.touchStartX;
                const dy = touch.clientY - this.touchStartY;
                this.player.vx += dx * 0.02;
                this.player.vy += dy * 0.02;
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
            }
        });
        this.canvas.addEventListener('touchend', () => { isDragging = false; });

        // Mouse drag support
        this.canvas.addEventListener('mousedown', (e) => {
            this.touchStartX = e.clientX;
            this.touchStartY = e.clientY;
            isDragging = true;
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - this.touchStartX;
                const dy = e.clientY - this.touchStartY;
                this.player.vx += dx * 0.01;
                this.player.vy += dy * 0.01;
                this.touchStartX = e.clientX;
                this.touchStartY = e.clientY;
            }
        });
        this.canvas.addEventListener('mouseup', () => { isDragging = false; });

        // Resize
        window.addEventListener('resize', () => this.resize());

        // UI Buttons
        document.getElementById('startBtn').onclick = () => this.startGame();
        document.getElementById('restartBtn').onclick = () => this.startGame();
    }

    updatePlayer(dt) {
        // Keyboard input
        const speed = 200 * dt * this.timeScale;
        if (this.keys['arrowleft'] || this.keys['a']) this.player.vx -= speed;
        if (this.keys['arrowright'] || this.keys['d']) this.player.vx += speed;
        if (this.keys['arrowup'] || this.keys['w']) this.player.vy -= speed;
        if (this.keys['arrowdown'] || this.keys['s']) this.player.vy += speed;

        // Physics with drag
        this.player.vx *= 0.92;
        this.player.vy *= 0.92;
        this.player.x += this.player.vx * this.timeScale;
        this.player.y += this.player.vy * this.timeScale;

        // Boundaries
        this.player.x = Math.max(this.player.size, Math.min(this.width - this.player.size, this.player.x));
        this.player.y = Math.max(this.player.size, Math.min(this.height - this.player.size, this.player.y));

        // Trail
        this.player.trail.push({x: this.player.x, y: this.player.y, alpha: 1});
        if (this.player.trail.length > 15) this.player.trail.shift();
        this.player.trail.forEach((p, i) => p.alpha -= 0.08);
        this.player.trail = this.player.trail.filter(p => p.alpha > 0);
    }

    updateGame(dt) {
        // Powerup timers
        if (this.shieldTime > 0) this.shieldTime -= dt;
        if (this.slowMoTime > 0) {
            this.slowMoTime -= dt;
            this.timeScale = 0.5;
        } else {
            this.timeScale = 1;
        }
        if (this.slowMoTime <= 0) this.timeScale = 1;
        
        // Score with multiplier
        this.gameTime += dt;
        this.score = Math.floor(this.gameTime * 10 * this.scoreMultiplier);

        // Obstacles spawn
        this.obstacleSpawnTimer += dt * this.gameSpeed;
        if (this.obstacleSpawnTimer > this.nextObstacleTime) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
            this.nextObstacleTime = Math.max(0.2, 1.2 * Math.pow(0.995, this.gameTime));
        }

        // Powerups spawn
        this.powerupSpawnTimer += dt * this.gameSpeed;
        if (this.powerupSpawnTimer > this.nextPowerupTime) {
            this.spawnPowerup();
            this.powerupSpawnTimer = 0;
            this.nextPowerupTime = 15 + Math.random() * 20; // 15-35s
        }

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x += obs.vx * this.gameSpeed * dt;
            obs.y += obs.vy * this.gameSpeed * dt;
            obs.life -= dt;

            if (obs.life <= 0 || obs.x < -100 || obs.x > this.width + 100 || obs.y < -100 || obs.y > this.height + 100) {
                this.obstacles.splice(i, 1);
                continue;
            }

            // Collision with player
            const dx = this.player.x - obs.x;
            const dy = this.player.y - obs.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < this.player.size + obs.size) {
                if (this.shieldTime > 0) {
                    this.createExplosion(obs.x, obs.y);
                    this.playSound('shieldHit');
                    this.obstacles.splice(i, 1);
                } else {
                    this.gameOver();
                    return;
                }
            }
        }

        // Update powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pu = this.powerups[i];
            pu.x += pu.vx * dt;
            pu.y += pu.vy * dt;
            pu.life -= dt;
            pu.rotation += dt * 3;

            if (pu.life <= 0 || pu.x < -50 || pu.x > this.width + 50 || pu.y < -50 || pu.y > this.height + 50) {
                this.powerups.splice(i, 1);
                continue;
            }

            // Collect
            const dx = this.player.x - pu.x;
            const dy = this.player.y - pu.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < this.player.size + pu.size) {
                this.collectPowerup(pu.type);
                this.createParticles(pu.x, pu.y, pu.color);
                this.powerups.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 100 * dt; // gravity
            p.life -= dt;
            p.alpha = p.life / p.maxLife;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    spawnPowerup() {
        const types = ['slowmo', 'shield', 'boost'];
        const type = types[Math.floor(Math.random() * types.length)];
        const side = Math.floor(Math.random() * 4);
        let x, y, vx, vy, size = 18, color;
        switch (type) {
            case 'slowmo': color = '#00ffff'; break;
            case 'shield': color = '#aa00ff'; break;
            case 'boost': color = '#ff00ff'; break;
        }
        switch (side) {
            case 0: x = Math.random() * this.width; y = -size; vx = (Math.random() - 0.5) * 50; vy = 80; break;
            case 1: x = this.width + size; y = Math.random() * this.height; vx = -80; vy = (Math.random() - 0.5) * 50; break;
            case 2: x = Math.random() * this.width; y = this.height + size; vx = (Math.random() - 0.5) * 50; vy = -80; break;
            case 3: x = -size; y = Math.random() * this.height; vx = 80; vy = (Math.random() - 0.5) * 50; break;
        }
        this.powerups.push({x, y, vx, vy, size, type, color, life: 8, rotation: 0});
    }

    collectPowerup(type) {
        switch (type) {
            case 'slowmo':
                this.slowMoTime = this.powerupDuration;
                this.playSound('slowmo');
                break;
            case 'shield':
                this.shieldTime = this.powerupDuration;
                this.playSound('shield');
                break;
            case 'boost':
                this.scoreMultiplier = 3;
                setTimeout(() => { this.scoreMultiplier = 1; }, this.powerupDuration * 1000);
                this.playSound('boost');
                break;
        }
    }

    createExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 400,
                vy: (Math.random() - 0.5) * 400,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 1,
                color: '#ff00ff'
            });
        }
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.8,
                maxLife: 0.8,
                color
            });
        }
    }

    spawnObstacle() {
        const side = Math.floor(Math.random() * 4);
        const size = 15 + Math.random() * 25;
        let x, y, vx, vy;
        switch (side) {
            case 0: // Top
                x = Math.random() * this.width;
                y = -size;
                vx = (Math.random() - 0.5) * 100;
                vy = 150 + Math.random() * 100;
                break;
            case 1: // Right
                x = this.width + size;
                y = Math.random() * this.height;
                vx = -150 - Math.random() * 100;
                vy = (Math.random() - 0.5) * 100;
                break;
            case 2: // Bottom
                x = Math.random() * this.width;
                y = this.height + size;
                vx = (Math.random() - 0.5) * 100;
                vy = -150 - Math.random() * 100;
                break;
            case 3: // Left
                x = -size;
                y = Math.random() * this.height;
                vx = 150 + Math.random() * 100;
                vy = (Math.random() - 0.5) * 100;
                break;
        }
        this.obstacles.push({x, y, vx, vy, size, life: 5, color: ['#ff00ff', '#aa00ff'][Math.floor(Math.random()*2)] });
    }

    drawPlayer() {
        // Shield glow
        if (this.shieldTime > 0) {
            this.ctx.shadowColor = '#aa00ff';
            this.ctx.shadowBlur = 60;
            this.ctx.strokeStyle = 'rgba(170, 0, 255, 0.6)';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.size + 10, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Trail glow
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 30;
        this.player.trail.forEach((p, i) => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.shadowBlur = 20 * p.alpha;
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, this.player.size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Main orb - slowmo tint
        this.ctx.shadowBlur = 50;
        this.ctx.shadowColor = this.slowMoTime > 0 ? '#66ffff' : '#00ffff';
        this.ctx.fillStyle = this.slowMoTime > 0 ? '#66ffff' : '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner glow
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0; // Reset
    }

    render() {
        // Screen shake
        this.ctx.save();
        if (this.shakeIntensity > 0) {
            this.ctx.translate(
                (Math.random() - 0.5) * this.shakeIntensity,
                (Math.random() - 0.5) * this.shakeIntensity
            );
            this.shakeIntensity *= 0.9;
        }

        // Clear with fade for trails
        this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw bg pulse effect (handled in CSS, but add subtle canvas gradient)
        const gradient = this.ctx.createRadialGradient(this.width/2, this.height/2, 0, this.width/2, this.height/2, Math.max(this.width, this.height)/2);
        gradient.addColorStop(0, 'rgba(26, 26, 46, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.state === 'PLAYING') {
            this.drawPlayer();
            
            // Draw obstacles
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.shadowBlur = 30;
            this.obstacles.forEach(obs => {
                this.ctx.save();
                this.ctx.shadowColor = obs.color;
                this.ctx.shadowBlur = 40;
                this.ctx.fillStyle = obs.color;
                this.ctx.beginPath();
                this.ctx.arc(obs.x, obs.y, obs.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Inner glow
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#ffffff';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(obs.x, obs.y, obs.size * 0.6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            });
            this.ctx.shadowBlur = 0;
            
            // Draw powerups
            this.powerups.forEach(pu => {
                this.ctx.save();
                this.ctx.translate(pu.x, pu.y);
                this.ctx.rotate(pu.rotation);
                this.ctx.shadowColor = pu.color;
                this.ctx.shadowBlur = 25;
                this.ctx.fillStyle = pu.color;
                
                // Shape based on type
                this.ctx.beginPath();
                if (pu.type === 'slowmo') {
                    this.ctx.moveTo(0, -pu.size);
                    this.ctx.lineTo(pu.size * 0.6, pu.size * 0.6);
                    this.ctx.lineTo(-pu.size * 0.6, pu.size * 0.6);
                } else if (pu.type === 'shield') {
                    this.ctx.rect(-pu.size/2, -pu.size/2, pu.size, pu.size);
                } else { // boost star
                    for (let j = 0; j < 5; j++) {
                        const angle = (Math.PI * 2 * j / 5) - Math.PI / 2;
                        const r = j % 2 === 0 ? pu.size : pu.size * 0.4;
                        this.ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
                
                // Glow pulse
                this.ctx.shadowBlur = 10;
                this.ctx.strokeStyle = pu.color;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                this.ctx.restore();
            });

            // Draw particles
            this.particles.forEach(p => {
                this.ctx.save();
                this.ctx.globalAlpha = p.alpha;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            });
        }
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }

    update(dt) {
        if (this.state === 'PLAYING') {
            this.updatePlayer(dt);
            this.updateGame(dt);
            this.gameSpeed = 1 + Math.pow(this.gameTime * 0.001, 1.2);
            this.updateUI();
        }
    }

    loop(time = 0) {
        const dt = Math.min((time - (this.lastTime || time)) / 1000, 0.05); // Cap delta
        this.lastTime = time;
        this.update(dt);
        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }

    startGame() {
        if (!this.username) {
            document.getElementById('usernameModal').classList.add('show');
            return;
        }
        this.state = 'PLAYING';
        this.score = 0;
        this.gameTime = 0;
        this.gameSpeed = 1;
        this.timeScale = 1;
        this.player.x = this.width / 2;
        this.player.y = this.height / 2;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.trail = [];
        this.obstacles = [];
        this.powerups = [];
        this.particles = [];
        this.shieldTime = 0;
        this.slowMoTime = 0;
        this.scoreMultiplier = 1;
        this.obstacleSpawnTimer = 0;
        this.powerupSpawnTimer = 0;
        document.getElementById('gameOverScreen').classList.remove('show');
        this.stopBGMusic();
        this.startBGMusic();
        this.playSound('start');
        this.updateUI();
        // Listen to leaderboard during game
        this.loadTopScores();
    }

    shakeIntensity = 0;

    gameOver() {
        this.state = 'GAMEOVER';
        this.stopBGMusic();
        document.getElementById('finalScore').textContent = this.score;
        
        // Submit to leaderboard
        this.submitScore();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('neonDashHigh', this.highScore);
        }
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').classList.add('show');
        this.playSound('gameover');
        this.shakeIntensity = 20;
        
        // Load updated leaderboard
        this.loadTopScores();
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        
        let status = '';
        if (this.shieldTime > 0) status += `🛡️ ${Math.ceil(this.shieldTime)}s | `;
        if (this.slowMoTime > 0) status += `🐌 ${Math.ceil(this.slowMoTime)}s | `;
        if (this.scoreMultiplier > 1) status += `⭐ x${this.scoreMultiplier} | `;
        document.getElementById('powerupStatus').textContent = status || '';
    }

    playSound(type) {
        if (!this.audioCtx) return;
        this.audioCtx.resume().then(() => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            
            switch (type) {
                case 'start':
                    osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.2);
                    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
                    break;
                case 'gameover':
                    osc.frequency.setValueAtTime(200, this.audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(50, this.audioCtx.currentTime + 0.5);
                    gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
                    break;
                case 'hit':
                    osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
                    break;
                case 'shieldHit':
                    osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.05);
                    osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.15);
                    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
                    break;
                case 'slowmo':
                    osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.2);
                    gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
                    break;
                case 'shield':
                    osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.3);
                    gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);
                    break;
                case 'boost':
                    osc.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1500, this.audioCtx.currentTime + 0.1);
                    osc.frequency.exponentialRampToValueAtTime(600, this.audioCtx.currentTime + 0.3);
                    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);
                    break;
                case 'dodge':
                    osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1800, this.audioCtx.currentTime + 0.05);
                    gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);
                    break;
            }
            
            osc.type = 'sine';
            osc.start(this.audioCtx.currentTime);
            gain.gain.setTargetAtTime(0.01, this.audioCtx.currentTime + 0.01, 0.01);
            osc.stop(this.audioCtx.currentTime + 0.5);
        });
    }

    startBGMusic() {
        if (this.bgOsc) return;
        this.audioCtx.resume();
        this.bgOsc = this.audioCtx.createOscillator();
        const bgGain = this.audioCtx.createGain();
        this.bgOsc.connect(bgGain);
        bgGain.connect(this.audioCtx.destination);
        this.bgOsc.frequency.value = 55; // Low hum
        this.bgOsc.type = 'sine';
        bgGain.gain.value = 0.05;
        this.bgOsc.start();
    }

    stopBGMusic() {
        if (this.bgOsc) {
            this.bgOsc.stop();
            this.bgOsc = null;
        }
    }
}

// Init game
window.addEventListener('load', () => {
    const game = new NeonDash();
    window.neonDash = game; // Global for debugging
});
