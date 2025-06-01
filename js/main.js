function initGame() {
    loadGameState();
    
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Load textures
    loadTextures();
    
    // Initialize resources if none exist
    if (gameState.resources.trees.length === 0) {
        spawnInitialResources(canvas.width, canvas.height);
    }
    
    // Initialize UI and controls
    initInventoryUI();
    initControls();
    
    // Game loop
    function gameLoop() {
        update();
        render(ctx, canvas.width, canvas.height);
        requestAnimationFrame(gameLoop);
    }
    
    gameLoop();
    
    // Handle window close to save game
    window.addEventListener('beforeunload', saveGameState);
}

function update() {
    const now = Date.now();
    const elapsed = now - gameState.time.cycleStart;
    
    // Update day/night cycle
    if (gameState.time.isDay) {
        if (elapsed >= DAY_DURATION) {
            gameState.time.isDay = false;
            gameState.time.cycleStart = now;
            document.getElementById('time-icon').textContent = '🌙';
            document.getElementById('time-text').textContent = 'Night';
        }
    } else {
        if (elapsed >= NIGHT_DURATION) {
            gameState.time.isDay = true;
            gameState.time.cycleStart = now;
            document.getElementById('time-icon').textContent = '☀️';
            document.getElementById('time-text').textContent = 'Day';
        }
        
        // Spawn slimes at night
        if (now - gameState.lastSlimeSpawn > SLIME_SPAWN_RATE) {
            spawnSlime();
            gameState.lastSlimeSpawn = now;
        }
    }
    
    // Update UI
    updateTimeUI();
    
    // Update player
    updatePlayer();
    
    // Update slimes
    updateSlimes();
    
    // Check for rock collection
    checkRockCollection();
    
    // Respawn resources
    if (now - gameState.lastResourceSpawn > 1000) {
        respawnResources(now);
        gameState.lastResourceSpawn = now;
    }
    
    // Update health UI
    updateHealthUI();
}

function spawnSlime() {
    const canvas = document.getElementById('game-canvas');
    const player = gameState.player;
    
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? -40 : canvas.width + 40;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? -40 : canvas.height + 40;
    }
    
    gameState.slimes.push({
        x: x,
        y: y,
        width: 50,
        height: 40,
        speed: 1 + Math.random(),
        health: 30
    });
}

function updateSlimes() {
    const player = gameState.player;
    
    for (let i = gameState.slimes.length - 1; i >= 0; i--) {
        const slime = gameState.slimes[i];
        
        const dx = player.x + player.width / 2 - (slime.x + slime.width / 2);
        const dy = player.y + player.height / 2 - (slime.y + slime.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            slime.x += (dx / distance) * slime.speed;
            slime.y += (dy / distance) * slime.speed;
        }
        
        if (checkCollision(player, slime)) {
            player.health -= 0.5;
            if (player.health <= 0) {
                player.health = 0;
            }
        }
        
        const canvas = document.getElementById('game-canvas');
        if (slime.x < -100 || slime.x > canvas.width + 100 || 
            slime.y < -100 || slime.y > canvas.height + 100) {
            gameState.slimes.splice(i, 1);
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', initGame);
