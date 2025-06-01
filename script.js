// Основные переменные игры
let player = {
    x: 2500,
    y: 2500,
    speed: 5,
    health: 100,
    maxHealth: 100,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    inventory: [],
    equipment: {
        weapon: null,
        pickaxe: null
    },
    stats: {
        strength: 1,
        agility: 1,
        intelligence: 1,
        stamina: 1,
        statPoints: 0
    },
    skills: []
};

let worldObjects = [];
let mobs = [];
let players = {};
let items = [];
let buildings = [];
let timeOfDay = 'day'; // day, evening, night, morning
let dayCycle = 0; // 0-1440 (24 минуты реального времени = 1 игровой день)
let isMobile = false;
let joystick = {
    active: false,
    x: 0,
    y: 0,
    angle: 0,
    force: 0
};

// DOM элементы
const world = document.getElementById('world');
const playerElement = document.getElementById('player');
const mobsContainer = document.getElementById('mobs');
const itemsContainer = document.getElementById('items');
const dayNightFilter = document.getElementById('day-night');
const healthDisplay = document.getElementById('health');
const xpDisplay = document.getElementById('xp');
const timeDisplay = document.getElementById('time');
const resourcesDisplay = document.getElementById('resources');
const inventoryModal = document.getElementById('inventory');
const craftingModal = document.getElementById('crafting');
const skillsModal = document.getElementById('skills');
const inventoryBtn = document.getElementById('inventory-btn');
const craftBtn = document.getElementById('craft-btn');
const skillsBtn = document.getElementById('skills-btn');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const loginScreen = document.getElementById('login-screen');
const usernameInput = document.getElementById('username-input');
const startBtn = document.getElementById('start-btn');
const joystickElement = document.getElementById('joystick');
const attackBtn = document.getElementById('attack-btn');
const interactBtn = document.getElementById('interact-btn');

// Проверка мобильного устройства
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    isMobile = true;
    document.getElementById('mobile-controls').style.display = 'block';
}

// Подключение к серверу Socket.io
const socket = io();

// Игровые предметы
const gameItems = {
    wood: { id: 'wood', name: 'Дерево', type: 'resource', image: 'assets/tree.png', stackable: true },
    stone: { id: 'stone', name: 'Камень', type: 'resource', image: 'assets/rock.png', stackable: true },
    iron: { id: 'iron', name: 'Железо', type: 'resource', image: 'assets/rock.png', stackable: true },
    wood_pickaxe: { id: 'wood_pickaxe', name: 'Деревянная кирка', type: 'pickaxe', image: 'assets/pickaxe_wood.png', damage: 1, efficiency: 1, durability: 30 },
    wood_sword: { id: 'wood_sword', name: 'Деревянный меч', type: 'weapon', image: 'assets/sword_wood.png', damage: 3, durability: 20 },
    stone_pickaxe: { id: 'stone_pickaxe', name: 'Каменная кирка', type: 'pickaxe', image: 'assets/pickaxe_wood.png', damage: 2, efficiency: 1.5, durability: 60 },
    stone_sword: { id: 'stone_sword', name: 'Каменный меч', type: 'weapon', image: 'assets/sword_wood.png', damage: 5, durability: 40 }
};

// Рецепты крафта
const craftingRecipes = [
    { id: 'wood_pickaxe', ingredients: [{ id: 'wood', count: 5 }], result: 'wood_pickaxe' },
    { id: 'wood_sword', ingredients: [{ id: 'wood', count: 5 }], result: 'wood_sword' },
    { id: 'stone_pickaxe', ingredients: [{ id: 'wood', count: 3 }, { id: 'stone', count: 3 }], result: 'stone_pickaxe' },
    { id: 'stone_sword', ingredients: [{ id: 'wood', count: 2 }, { id: 'stone', count: 5 }], result: 'stone_sword' }
];

// Навыки
const skills = [
    { id: 'strength', name: 'Сила', description: 'Увеличивает урон в ближнем бою', maxLevel: 10 },
    { id: 'agility', name: 'Ловкость', description: 'Увеличивает шанс критического удара и уклонения', maxLevel: 10 },
    { id: 'intelligence', name: 'Интеллект', description: 'Увеличивает магический урон и навыки', maxLevel: 10 },
    { id: 'stamina', name: 'Выносливость', description: 'Увеличивает здоровье и защиту', maxLevel: 10 }
];

// Инициализация игры
function initGame() {
    // Генерация мира
    generateWorld();
    
    // Настройка управления
    setupControls();
    
    // Настройка интерфейса
    setupUI();
    
    // Начало игрового цикла
    gameLoop();
    
    // Запуск цикла дня и ночи
    startDayNightCycle();
    
    // Генерация мобов
    spawnMobs();
    
    // Подключение обработчиков событий сокетов
    setupSocketEvents();
}

// Генерация мира
function generateWorld() {
    // Генерация деревьев
    for (let i = 0; i < 200; i++) {
        const tree = {
            type: 'tree',
            x: Math.floor(Math.random() * 5000),
            y: Math.floor(Math.random() * 5000),
            health: 3,
            maxHealth: 3
        };
        worldObjects.push(tree);
        
        const treeElement = document.createElement('div');
        treeElement.className = 'tree';
        treeElement.style.left = `${tree.x}px`;
        treeElement.style.top = `${tree.y}px`;
        world.appendChild(treeElement);
    }
    
    // Генерация камней
    for (let i = 0; i < 150; i++) {
        const rock = {
            type: 'rock',
            x: Math.floor(Math.random() * 5000),
            y: Math.floor(Math.random() * 5000),
            health: 5,
            maxHealth: 5,
            resource: Math.random() > 0.7 ? 'iron' : 'stone'
        };
        worldObjects.push(rock);
        
        const rockElement = document.createElement('div');
        rockElement.className = 'rock';
        rockElement.style.left = `${rock.x}px`;
        rockElement.style.top = `${rock.y}px`;
        world.appendChild(rockElement);
    }
}

// Настройка управления
function setupControls() {
    // Клавиатура
    document.addEventListener('keydown', (e) => {
        if (e.key === 'i') toggleInventory();
        if (e.key === 'c') toggleCrafting();
        if (e.key === 's') toggleSkills();
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // Мобильное управление
    if (isMobile) {
        // Джойстик
        joystickElement.addEventListener('touchstart', handleJoystickStart);
        joystickElement.addEventListener('touchmove', handleJoystickMove);
        joystickElement.addEventListener('touchend', handleJoystickEnd);
        
        // Кнопки действий
        attackBtn.addEventListener('touchstart', () => attack());
        interactBtn.addEventListener('touchstart', () => interact());
    } else {
        // Клавиши WASD для ПК
        document.addEventListener('keydown', (e) => {
            if (e.key === 'w') player.y -= player.speed;
            if (e.key === 's') player.y += player.speed;
            if (e.key === 'a') player.x -= player.speed;
            if (e.key === 'd') player.x += player.speed;
            if (e.key === ' ') attack();
            if (e.key === 'e') interact();
        });
    }
    
    // Кнопки интерфейса
    inventoryBtn.addEventListener('click', toggleInventory);
    craftBtn.addEventListener('click', toggleCrafting);
    skillsBtn.addEventListener('click', toggleSkills);
    startBtn.addEventListener('click', startGame);
    
    // Закрытие модальных окон
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.add('hidden');
        });
    });
    
    // Чат
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
}

// Обработчики джойстика
function handleJoystickStart(e) {
    e.preventDefault();
    const rect = joystickElement.getBoundingClientRect();
    joystick.active = true;
    joystick.x = e.touches[0].clientX - rect.left;
    joystick.y = e.touches[0].clientY - rect.top;
}

function handleJoystickMove(e) {
    if (!joystick.active) return;
    e.preventDefault();
    const rect = joystickElement.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;
    
    const centerX = 50;
    const centerY = 50;
    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;
    
    joystick.angle = Math.atan2(deltaY, deltaX);
    joystick.force = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 50) / 50;
}

function handleJoystickEnd() {
    joystick.active = false;
    joystick.force = 0;
}

// Настройка интерфейса
function setupUI() {
    updateStats();
    renderInventory();
    renderCrafting();
    renderSkills();
}

// Обновление статистики
function updateStats() {
    healthDisplay.textContent = `❤️ ${player.health}/${player.maxHealth}`;
    xpDisplay.textContent = `⭐ Ур.${player.level} (${player.xp}/${player.xpToNextLevel})`;
    
    // Подсчет ресурсов
    const woodCount = countItem('wood');
    const stoneCount = countItem('stone');
    const ironCount = countItem('iron');
    resourcesDisplay.textContent = `🌲 ${woodCount} | ⛏️ ${stoneCount} | 🪙 ${ironCount}`;
    
    // Время суток
    let timeText = '';
    if (timeOfDay === 'day') timeText = '🌞 День';
    else if (timeOfDay === 'evening') timeText = '🌇 Вечер';
    else if (timeOfDay === 'night') timeText = '🌙 Ночь';
    else timeText = '🌅 Утро';
    timeDisplay.textContent = timeText;
}

// Игровой цикл
function gameLoop() {
    // Движение игрока
    if (joystick.active && isMobile) {
        const speed = player.speed * joystick.force;
        player.x += Math.cos(joystick.angle) * speed;
        player.y += Math.sin(joystick.angle) * speed;
    }
    
    // Ограничение игрока в пределах мира
    player.x = Math.max(0, Math.min(5000 - 64, player.x));
    player.y = Math.max(0, Math.min(5000 - 64, player.y));
    
    // Обновление позиции игрока
    playerElement.style.left = `${player.x}px`;
    playerElement.style.top = `${player.y}px`;
    
    // Центрирование мира на игроке
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const offsetX = -player.x + screenWidth / 2 - 32;
    const offsetY = -player.y + screenHeight / 2 - 32;
    world.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    
    // Отправка позиции на сервер
    socket.emit('playerMove', { x: player.x, y: player.y });
    
    // Обновление UI
    updateStats();
    
    requestAnimationFrame(gameLoop);
}

// Цикл дня и ночи
function startDayNightCycle() {
    setInterval(() => {
        dayCycle = (dayCycle + 1) % 1440;
        
        // Определение времени суток
        if (dayCycle < 360) timeOfDay = 'day';
        else if (dayCycle < 540) timeOfDay = 'evening';
        else if (dayCycle < 900) timeOfDay = 'night';
        else timeOfDay = 'morning';
        
        // Изменение освещения
        let darkness = 0;
        if (timeOfDay === 'evening') darkness = (dayCycle - 360) / 180 * 0.7;
        else if (timeOfDay === 'night') darkness = 0.7;
        else if (timeOfDay === 'morning') darkness = 0.7 - (dayCycle - 900) / 180 * 0.7;
        
        dayNightFilter.style.backgroundColor = `rgba(0, 0, 0, ${darkness})`;
    }, 1000); // 1 реальная секунда = 1 игровая минута
}

// Генерация мобов
function spawnMobs() {
    setInterval(() => {
        if (mobs.length < 20) {
            const mob = {
                id: `mob-${Date.now()}`,
                type: 'slime',
                x: Math.floor(Math.random() * 5000),
                y: Math.floor(Math.random() * 5000),
                health: 30,
                maxHealth: 30,
                damage: 5,
                speed: 2,
                target: null
            };
            
            mobs.push(mob);
            
            const mobElement = document.createElement('div');
            mobElement.className = 'mob';
            mobElement.id = mob.id;
            mobElement.style.backgroundImage = 'url("assets/slime.png")';
            mobElement.style.left = `${mob.x}px`;
            mobElement.style.top = `${mob.y}px`;
            mobsContainer.appendChild(mobElement);
            
            // Отправка моба на сервер
            socket.emit('mobSpawn', mob);
        }
    }, 5000);
    
    // ИИ мобов
    setInterval(() => {
        mobs.forEach(mob => {
            // Простое преследование игрока
            const dx = player.x - mob.x;
            const dy = player.y - mob.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 300) { // Дистанция агрессии
                mob.target = { x: player.x, y: player.y };
                
                // Движение к цели
                if (distance > 50) { // Дистанция атаки
                    const angle = Math.atan2(dy, dx);
                    mob.x += Math.cos(angle) * mob.speed;
                    mob.y += Math.sin(angle) * mob.speed;
                } else {
                    // Атака
                    if (Math.random() < 0.1) {
                        player.health -= mob.damage;
                        if (player.health <= 0) {
                            player.health = player.maxHealth;
                            player.x = 2500;
                            player.y = 2500;
                            addMessage('Вы умерли и возродились у начала!');
                        }
                    }
                }
                
                // Обновление позиции на экране
                const mobElement = document.getElementById(mob.id);
                if (mobElement) {
                    mobElement.style.left = `${mob.x}px`;
                    mobElement.style.top = `${mob.y}px`;
                }
                
                // Отправка обновления на сервер
                socket.emit('mobMove', { id: mob.id, x: mob.x, y: mob.y });
            }
        });
    }, 100);
}

// Атака
function attack() {
    if (player.equipment.weapon) {
        // Проверка попадания по мобам
        mobs.forEach(mob => {
            const dx = player.x - mob.x;
            const dy = player.y - mob.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 80) { // Дистанция атаки
                const damage = player.equipment.weapon.damage + player.stats.strength;
                mob.health -= damage;
                
                if (mob.health <= 0) {
                    // Убийство моба
                    mob.health = 0;
                    addMessage(`Вы убили ${mob.type}!`);
                    
                    // Получение опыта
                    addXP(10);
                    
                    // Дроп предметов
                    if (Math.random() < 0.5) {
                        createItem('wood', mob.x, mob.y);
                    }
                    if (Math.random() < 0.3) {
                        createItem('stone', mob.x, mob.y);
                    }
                    
                    // Удаление моба
                    const index = mobs.findIndex(m => m.id === mob.id);
                    if (index !== -1) mobs.splice(index, 1);
                    
                    const mobElement = document.getElementById(mob.id);
                    if (mobElement) mobElement.remove();
                    
                    // Отправка на сервер
                    socket.emit('mobKilled', mob.id);
                }
            }
        });
    } else {
        addMessage('У вас нет оружия!');
    }
}

// Взаимодействие
function interact() {
    // Проверка объектов поблизости
    let nearestObject = null;
    let minDistance = Infinity;
    
    worldObjects.forEach(obj => {
        const dx = player.x - obj.x;
        const dy = player.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100 && distance < minDistance) {
            nearestObject = obj;
            minDistance = distance;
        }
    });
    
    if (nearestObject) {
        if (nearestObject.type === 'tree') {
            // Добыча дерева
            if (player.equipment.pickaxe) {
                nearestObject.health -= player.equipment.pickaxe.efficiency;
                
                if (nearestObject.health <= 0) {
                    // Уничтожение дерева
                    addMessage('Вы срубили дерево!');
                    createItem('wood', nearestObject.x, nearestObject.y);
                    
                    // Удаление дерева
                    const index = worldObjects.findIndex(o => o === nearestObject);
                    if (index !== -1) worldObjects.splice(index, 1);
                    
                    // Удаление с экрана
                    const trees = document.querySelectorAll('.tree');
                    trees.forEach(tree => {
                        if (parseInt(tree.style.left) === nearestObject.x && parseInt(tree.style.top) === nearestObject.y) {
                            tree.remove();
                        }
                    });
                    
                    // Получение опыта
                    addXP(2);
                }
            } else {
                addMessage('Вам нужна кирка для добычи дерева!');
            }
        } else if (nearestObject.type === 'rock') {
            // Добыча камня/железа
            if (player.equipment.pickaxe) {
                nearestObject.health -= player.equipment.pickaxe.efficiency;
                
                if (nearestObject.health <= 0) {
                    // Уничтожение камня
                    addMessage(`Вы добыли ${nearestObject.resource === 'iron' ? 'железо' : 'камень'}!`);
                    createItem(nearestObject.resource, nearestObject.x, nearestObject.y);
                    
                    // Удаление камня
                    const index = worldObjects.findIndex(o => o === nearestObject);
                    if (index !== -1) worldObjects.splice(index, 1);
                    
                    // Удаление с экрана
                    const rocks = document.querySelectorAll('.rock');
                    rocks.forEach(rock => {
                        if (parseInt(rock.style.left) === nearestObject.x && parseInt(rock.style.top) === nearestObject.y) {
                            rock.remove();
                        }
                    });
                    
                    // Получение опыта
                    addXP(3);
                }
            } else {
                addMessage('Вам нужна кирка для добычи камня!');
            }
        }
    }
    
    // Проверка предметов поблизости
    let nearestItem = null;
    minDistance = Infinity;
    
    items.forEach(item => {
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50 && distance < minDistance) {
            nearestItem = item;
            minDistance = distance;
        }
    });
    
    if (nearestItem) {
        // Подбор предмета
        addToInventory(nearestItem.type);
        addMessage(`Вы подобрали ${gameItems[nearestItem.type].name}!`);
        
        // Удаление предмета
        const index = items.findIndex(i => i.id === nearestItem.id);
        if (index !== -1) items.splice(index, 1);
        
        const itemElement = document.getElementById(nearestItem.id);
        if (itemElement) itemElement.remove();
        
        // Отправка на сервер
        socket.emit('itemPicked', nearestItem.id);
    }
}

// Создание предмета в мире
function createItem(itemType, x, y) {
    const item = {
        id: `item-${Date.now()}`,
        type: itemType,
        x: x,
        y: y
    };
    
    items.push(item);
    
    const itemElement = document.createElement('div');
    itemElement.className = 'item';
    itemElement.id = item.id;
    itemElement.style.backgroundImage = `url("${gameItems[itemType].image}")`;
    itemElement.style.left = `${x}px`;
    itemElement.style.top = `${y}px`;
    itemsContainer.appendChild(itemElement);
    
    // Отправка на сервер
    socket.emit('itemCreated', item);
}

// Инвентарь
function addToInventory(itemType, count = 1) {
    const item = gameItems[itemType];
    if (!item) return;
    
    if (item.stackable) {
        const existingItem = player.inventory.find(i => i.type === itemType);
        if (existingItem) {
            existingItem.count += count;
        } else {
            player.inventory.push({ type: itemType, count: count });
        }
    } else {
        player.inventory.push({ type: itemType, count: 1 });
    }
    
    renderInventory();
}

function countItem(itemType) {
    const item = player.inventory.find(i => i.type === itemType);
    return item ? item.count : 0;
}

function removeFromInventory(itemType, count = 1) {
    const itemIndex = player.inventory.findIndex(i => i.type === itemType);
    if (itemIndex === -1) return false;
    
    const item = player.inventory[itemIndex];
    if (item.count > count) {
        item.count -= count;
    } else {
        player.inventory.splice(itemIndex, 1);
    }
    
    renderInventory();
    return true;
}

function renderInventory() {
    const inventoryGrid = document.querySelector('.inventory-grid');
    inventoryGrid.innerHTML = '';
    
    player.inventory.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.innerHTML = `
            <img src="${gameItems[item.type].image}" alt="${gameItems[item.type].name}">
            <span>${item.count > 1 ? item.count : ''}</span>
        `;
        
        slot.addEventListener('click', () => {
            // Экипировка оружия/кирки
            if (gameItems[item.type].type === 'weapon') {
                player.equipment.weapon = { ...gameItems[item.type] };
                addMessage(`Вы экипировали ${gameItems[item.type].name}!`);
            } else if (gameItems[item.type].type === 'pickaxe') {
                player.equipment.pickaxe = { ...gameItems[item.type] };
                addMessage(`Вы экипировали ${gameItems[item.type].name}!`);
            }
        });
        
        inventoryGrid.appendChild(slot);
    });
    
    // Добавление пустых слотов
    for (let i = player.inventory.length; i < 20; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        inventoryGrid.appendChild(slot);
    }
}

function toggleInventory() {
    inventoryModal.classList.toggle('hidden');
    if (!inventoryModal.classList.contains('hidden')) {
        craftingModal.classList.add('hidden');
        skillsModal.classList.add('hidden');
    }
}

// Крафтинг
function renderCrafting() {
    const craftingGrid = document.querySelector('.crafting-grid');
    craftingGrid.innerHTML = '';
    
    craftingRecipes.forEach(recipe => {
        const slot = document.createElement('div');
        slot.className = 'crafting-slot';
        slot.innerHTML = `
            <img src="${gameItems[recipe.result].image}" alt="${gameItems[recipe.result].name}">
            <small>${getRecipeDescription(recipe)}</small>
        `;
        
        slot.addEventListener('click', () => {
            craftItem(recipe.id);
        });
        
        craftingGrid.appendChild(slot);
    });
}

function getRecipeDescription(recipe) {
    return recipe.ingredients.map(ing => {
        const item = gameItems[ing.id];
        return `${item.name} x${ing.count}`;
    }).join(' + ');
}

function craftItem(recipeId) {
    const recipe = craftingRecipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Проверка ингредиентов
    const canCraft = recipe.ingredients.every(ing => {
        return countItem(ing.id) >= ing.count;
    });
    
    if (canCraft) {
        // Удаление ингредиентов
        recipe.ingredients.forEach(ing => {
            removeFromInventory(ing.id, ing.count);
        });
        
        // Добавление результата
        addToInventory(recipe.result);
        addMessage(`Вы скрафтили ${gameItems[recipe.result].name}!`);
        
        // Получение опыта
        addXP(5);
    } else {
        addMessage('Не хватает материалов для крафта!');
    }
}

function toggleCrafting() {
    craftingModal.classList.toggle('hidden');
    if (!craftingModal.classList.contains('hidden')) {
        inventoryModal.classList.add('hidden');
        skillsModal.classList.add('hidden');
    }
}

// Прокачка характеристик
function renderSkills() {
    const skillsList = document.querySelector('.skills-list');
    skillsList.innerHTML = '';
    
    skills.forEach(skill => {
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';
        
        const currentLevel = player.stats[skill.id] || 0;
        const canUpgrade = player.stats.statPoints > 0 && currentLevel < skill.maxLevel;
        
        skillItem.innerHTML = `
            <div>
                <strong>${skill.name}</strong>
                <small>${skill.description}</small>
                <div>Уровень: ${currentLevel}/${skill.maxLevel}</div>
            </div>
            <button ${!canUpgrade ? 'disabled' : ''}>+</button>
        `;
        
        skillItem.querySelector('button').addEventListener('click', () => {
            upgradeSkill(skill.id);
        });
        
        skillsList.appendChild(skillItem);
    });
}

function upgradeSkill(skillId) {
    if (player.stats.statPoints > 0 && player.stats[skillId] < 10) {
        player.stats[skillId]++;
        player.stats.statPoints--;
        
        // Обновление характеристик
        if (skillId === 'stamina') {
            player.maxHealth = 100 + player.stats.stamina * 10;
            player.health = player.maxHealth;
        }
        
        renderSkills();
        updateStats();
    }
}

function toggleSkills() {
    skillsModal.classList.toggle('hidden');
    if (!skillsModal.classList.contains('hidden')) {
        inventoryModal.classList.add('hidden');
        craftingModal.classList.add('hidden');
    }
}

// Опыт и уровни
function addXP(amount) {
    player.xp += amount;
    
    if (player.xp >= player.xpToNextLevel) {
        player.level++;
        player.xp -= player.xpToNextLevel;
        player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
        player.stats.statPoints++;
        
        addMessage(`Поздравляем! Вы достигли ${player.level} уровня!`);
        addMessage('Вы получили 1 очко характеристик!');
    }
    
    updateStats();
}

// Чат
function addMessage(text, isSystem = false) {
    const message = document.createElement('p');
    message.textContent = text;
    if (isSystem) message.style.color = '#aaa';
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChatMessage() {
    const text = chatInput.value.trim();
    if (text) {
        socket.emit('chatMessage', text);
        chatInput.value = '';
    }
}

// События Socket.io
function setupSocketEvents() {
    socket.on('connect', () => {
        addMessage('Подключено к серверу', true);
    });
    
    socket.on('disconnect', () => {
        addMessage('Отключено от сервера', true);
    });
    
    socket.on('chatMessage', (data) => {
        addMessage(`${data.username}: ${data.message}`);
    });
    
    socket.on('playerJoined', (data) => {
        addMessage(`${data.username} присоединился к игре`, true);
        players[data.id] = data;
        renderOtherPlayer(data);
    });
    
    socket.on('playerLeft', (id) => {
        addMessage(`${players[id].username} покинул игру`, true);
        const playerElement = document.getElementById(`player-${id}`);
        if (playerElement) playerElement.remove();
        delete players[id];
    });
    
    socket.on('playerMoved', (data) => {
        if (players[data.id]) {
            players[data.id].x = data.x;
            players[data.id].y = data.y;
            
            const playerElement = document.getElementById(`player-${data.id}`);
            if (playerElement) {
                playerElement.style.left = `${data.x}px`;
                playerElement.style.top = `${data.y}px`;
            }
        }
    });
    
    socket.on('mobSpawned', (mob) => {
        if (!mobs.find(m => m.id === mob.id)) {
            mobs.push(mob);
            
            const mobElement = document.createElement('div');
            mobElement.className = 'mob';
            mobElement.id = mob.id;
            mobElement.style.backgroundImage = 'url("assets/slime.png")';
            mobElement.style.left = `${mob.x}px`;
            mobElement.style.top = `${mob.y}px`;
            mobsContainer.appendChild(mobElement);
        }
    });
    
    socket.on('mobMoved', (data) => {
        const mob = mobs.find(m => m.id === data.id);
        if (mob) {
            mob.x = data.x;
            mob.y = data.y;
            
            const mobElement = document.getElementById(data.id);
            if (mobElement) {
                mobElement.style.left = `${data.x}px`;
                mobElement.style.top = `${data.y}px`;
            }
        }
    });
    
    socket.on('mobKilled', (id) => {
        const index = mobs.findIndex(m => m.id === id);
        if (index !== -1) mobs.splice(index, 1);
        
        const mobElement = document.getElementById(id);
        if (mobElement) mobElement.remove();
    });
    
    socket.on('itemCreated', (item) => {
        if (!items.find(i => i.id === item.id)) {
            items.push(item);
            
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.id = item.id;
            itemElement.style.backgroundImage = `url("${gameItems[item.type].image}")`;
            itemElement.style.left = `${item.x}px`;
            itemElement.style.top = `${item.y}px`;
            itemsContainer.appendChild(itemElement);
        }
    });
    
    socket.on('itemPicked', (id) => {
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) items.splice(index, 1);
        
        const itemElement = document.getElementById(id);
        if (itemElement) itemElement.remove();
    });
}

function renderOtherPlayer(playerData) {
    const playerElement = document.createElement('div');
    playerElement.className = 'player-other';
    playerElement.id = `player-${playerData.id}`;
    playerElement.style.backgroundImage = 'url("assets/player.png")';
    playerElement.style.left = `${playerData.x}px`;
    playerElement.style.top = `${playerData.y}px`;
    playerElement.innerHTML = `<span>${playerData.username}</span>`;
    world.appendChild(playerElement);
}

// Начало игры
function startGame() {
    const username = usernameInput.value.trim();
    if (username.length < 3 || username.length > 16) {
        alert('Имя игрока должно быть от 3 до 16 символов!');
        return;
    }
    
    loginScreen.classList.add('hidden');
    addMessage(`Добро пожаловать, ${username}!`, true);
    
    // Отправка данных игрока на сервер
    socket.emit('playerJoin', {
        username: username,
        x: player.x,
        y: player.y
    });
}

// Запуск игры при загрузке страницы
window.addEventListener('load', initGame);