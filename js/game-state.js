// Game constants
const DAY_DURATION = 6 * 60 * 1000; // 6 minutes in milliseconds
const NIGHT_DURATION = 6 * 60 * 1000; // 6 minutes in milliseconds
const RESOURCE_RESPAWN_TIME = 30 * 1000; // 30 seconds in milliseconds
const SLIME_SPAWN_RATE = 3000; // 3 seconds during night

// Game state
const gameState = {
    player: {
        x: 400,
        y: 300,
        width: 40,
        height: 60,
        speed: 3,
        health: 100,
        maxHealth: 100,
        inventory: {
            wood: 0,
            stone: 0
        },
        selectedItem: null
    },
    resources: {
        trees: [],
        rocks: []
    },
    slimes: [],
    time: {
        isDay: true,
        cycleStart: Date.now(),
        nextTransition: DAY_DURATION
    },
    controls: {
        left: false,
        right: false,
        up: false,
        down: false
    },
    lastResourceSpawn: 0,
    lastSlimeSpawn: 0
};

// Load game state from localStorage
function loadGameState() {
    const savedState = localStorage.getItem('slimeGameState');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        Object.assign(gameState, parsed);
        gameState.time.cycleStart = Date.now() - (parsed.time.currentTime || 0);
    }
}

// Save game state to localStorage
function saveGameState() {
    const currentTime = Date.now() - gameState.time.cycleStart;
    const stateToSave = {
        player: {
            x: gameState.player.x,
            y: gameState.player.y,
            health: gameState.player.health,
            maxHealth: gameState.player.maxHealth,
            inventory: {...gameState.player.inventory},
            selectedItem: gameState.player.selectedItem
        },
        resources: {
            trees: [...gameState.resources.trees],
            rocks: [...gameState.resources.rocks]
        },
        slimes: [...gameState.slimes],
        time: {
            isDay: gameState.time.isDay,
            currentTime: currentTime,
            nextTransition: gameState.time.isDay ? DAY_DURATION - (currentTime % DAY_DURATION) : NIGHT_DURATION - (currentTime % NIGHT_DURATION)
        }
    };
    localStorage.setItem('slimeGameState', JSON.stringify(stateToSave));
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}
