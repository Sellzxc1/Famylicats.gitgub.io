function initInventoryUI() {
    const inventory = document.getElementById('inventory');
    inventory.innerHTML = '';
    
    createInventorySlot('wood', 'assets/tree.png');
    createInventorySlot('stone', 'assets/rock.png');
    
    updateInventoryUI();
}

function createInventorySlot(itemType, iconSrc) {
    const inventory = document.getElementById('inventory');
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.dataset.item = itemType;
    
    const img = document.createElement('img');
    img.src = iconSrc;
    img.alt = itemType;
    
    const count = document.createElement('div');
    count.className = 'count';
    count.textContent = '0';
    count.id = `${itemType}-count`;
    
    slot.appendChild(img);
    slot.appendChild(count);
    inventory.appendChild(slot);
    
    slot.addEventListener('click', () => {
        if (gameState.player.inventory[itemType] > 0) {
            gameState.player.selectedItem = itemType;
            document.querySelectorAll('.inventory-slot').forEach(s => {
                s.style.borderColor = '#555';
            });
            slot.style.borderColor = 'gold';
        }
    });
}

function updateInventoryUI() {
    document.getElementById('wood-count').textContent = gameState.player.inventory.wood;
    document.getElementById('stone-count').textContent = gameState.player.inventory.stone;
    
    document.querySelectorAll('.inventory-slot').forEach(slot => {
        slot.style.borderColor = slot.dataset.item === gameState.player.selectedItem ? 'gold' : '#555';
    });
}

function updateTimeUI() {
    const elapsed = Date.now() - gameState.time.cycleStart;
    const timeLeft = gameState.time.isDay ? 
        Math.max(0, DAY_DURATION - elapsed) : 
        Math.max(0, NIGHT_DURATION - elapsed);
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    document.getElementById('time-display').textContent = `Time left: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const nightOpacity = gameState.time.isDay ? 
        0 : 
        Math.min(0.7, (elapsed / NIGHT_DURATION) * 0.7);
    document.getElementById('night-overlay').style.opacity = nightOpacity;
}

function updateHealthUI() {
    const player = gameState.player;
    document.getElementById('health-fill').style.width = `${(player.health / player.maxHealth) * 100}%`;
    document.getElementById('health-text').textContent = `${Math.round(player.health)}/${player.maxHealth}`;
}
