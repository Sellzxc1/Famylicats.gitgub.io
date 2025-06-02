// Game configuration
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    backgroundColor: '#3498db'
};

// Game variables
let game = new Phaser.Game(config);
let player;
let cursors;
let joystick;
let worldWidth = 5000;
let worldHeight = 5000;
let trees = [];
let rocks = [];
let slimes = [];
let isNight = false;
let dayNightCycle = 0; // 0-600 (10 minutes at 60fps)
let inventory = {
    wood: 0,
    stone: 0
};
let playerStats = {
    health: 100,
    maxHealth: 100,
    level: 1,
    xp: 0,
    nextLevel: 100,
    attackDamage: 10
};
let isAttacking = false;
let attackCooldown = false;
let isDead = false;

// Preload assets
function preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('trava', 'assets/trava.png');
    this.load.image('tree', 'assets/tree.png');
    this.load.image('rock', 'assets/rock.png');
    this.load.image('slime', 'assets/slime.png');
}

// Create game objects
function create() {
    // Create world
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    
    // Create grass background
    let grass = this.add.tileSprite(0, 0, worldWidth, worldHeight, 'trava');
    grass.setOrigin(0, 0);
    
    // Create player
    player = this.physics.add.sprite(worldWidth / 2, worldHeight / 2, 'player');
    player.setCollideWorldBounds(true);
    player.setScale(0.5);
    
    // Create trees
    for (let i = 0; i < 100; i++) {
        let validPosition = false;
        let tree;
        
        while (!validPosition) {
            tree = this.physics.add.sprite(
                Phaser.Math.Between(50, worldWidth - 50),
                Phaser.Math.Between(50, worldHeight - 50),
                'tree'
            );
            tree.setScale(0.5);
            tree.body.immovable = true;
            
            validPosition = true;
            
            // Check distance from other trees
            for (let otherTree of trees) {
                if (Phaser.Math.Distance.Between(tree.x, tree.y, otherTree.x, otherTree.y) < 100) {
                    validPosition = false;
                    tree.destroy();
                    break;
                }
            }
        }
        
        trees.push(tree);
    }
    
    // Create rocks
    for (let i = 0; i < 200; i++) {
        let validPosition = false;
        let rock;
        
        while (!validPosition) {
            rock = this.physics.add.sprite(
                Phaser.Math.Between(50, worldWidth - 50),
                Phaser.Math.Between(50, worldHeight - 50),
                'rock'
            );
            rock.setScale(0.5);
            rock.body.immovable = true;
            
            validPosition = true;
            
            // Check distance from other rocks
            for (let otherRock of rocks) {
                if (Phaser.Math.Distance.Between(rock.x, rock.y, otherRock.x, otherRock.y) < 50) {
                    validPosition = false;
                    rock.destroy();
                    break;
                }
            }
            
            // Check distance from trees
            for (let tree of trees) {
                if (Phaser.Math.Distance.Between(rock.x, rock.y, tree.x, tree.y) < 50) {
                    validPosition = false;
                    rock.destroy();
                    break;
                }
            }
        }
        
        rocks.push(rock);
    }
    
    // Set up camera
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    
    // Set up joystick
    setupJoystick();
    
    // Set up controls
    cursors = this.input.keyboard.createCursorKeys();
    
    // Set up UI events
    document.getElementById('attack-btn').addEventListener('touchstart', () => {
        isAttacking = true;
    });
    document.getElementById('attack-btn').addEventListener('touchend', () => {
        isAttacking = false;
    });
    
    document.getElementById('inventory-btn').addEventListener('click', toggleInventory);
    document.getElementById('respawn-btn').addEventListener('click', respawnPlayer);
    
    // Set up collision
    this.physics.add.collider(player, trees);
    this.physics.add.collider(player, rocks);
    
    // Start day/night cycle
    dayNightCycle = 0;
    
    // Update UI
    updateUI();
}

// Update game state
function update() {
    if (isDead) return;
    
    // Handle player movement
    let velocityX = 0;
    let velocityY = 0;
    let speed = 200;
    
    if (cursors.left.isDown || (joystick && joystick.left)) {
        velocityX = -speed;
    } else if (cursors.right.isDown || (joystick && joystick.right)) {
        velocityX = speed;
    }
    
    if (cursors.up.isDown || (joystick && joystick.up)) {
        velocityY = -speed;
    } else if (cursors.down.isDown || (joystick && joystick.down)) {
        velocityY = speed;
    }
    
    player.setVelocity(velocityX, velocityY);
    
    // Handle attack
    if ((isAttacking || this.input.keyboard.addKey('SPACE').isDown) && !attackCooldown) {
        attack();
        attackCooldown = true;
        this.time.delayedCall(500, () => { attackCooldown = false; });
    }
    
    // Handle resource collection
    if (this.input.activePointer.isDown) {
        let pointer = this.input.activePointer;
        let worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // Check if clicking on a tree
        for (let tree of trees) {
            if (Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, tree.x, tree.y) < 50) {
                inventory.wood++;
                updateUI();
                break;
            }
        }
        
        // Check if clicking on a rock
        for (let rock of rocks) {
            if (Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, rock.x, rock.y) < 50) {
                inventory.stone++;
                updateUI();
                break;
            }
        }
    }
    
    // Update day/night cycle
    dayNightCycle++;
    if (dayNightCycle >= 600 * 60) { // 10 minutes at 60fps
        dayNightCycle = 0;
    }
    
    // Update time indicator
    let timePercentage = dayNightCycle / (600 * 60);
    document.getElementById('time-indicator').style.width = (timePercentage * 100) + '%';
    
    // Check if it's night (last 20% of cycle)
    let newIsNight = timePercentage > 0.8;
    if (newIsNight !== isNight) {
        isNight = newIsNight;
        if (isNight) {
            // Spawn slimes at night
            spawnSlimes();
        } else {
            // Remove slimes at day
            removeSlimes();
        }
    }
    
    // Update slimes
    if (isNight) {
        updateSlimes();
    }
}

// Set up virtual joystick
function setupJoystick() {
    let joystickArea = document.getElementById('joystick-container');
    let manager = nipplejs.create({
        zone: joystickArea,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white',
        size: 150
    });
    
    joystick = {
        up: false,
        down: false,
        left: false,
        right: false
    };
    
    manager.on('move', (evt, data) => {
        let angle = data.angle.radian;
        let distance = data.distance;
        
        joystick.up = angle > 2.356 && angle < 3.927 && distance > 20;
        joystick.down = angle > 5.497 && angle < 0.785 && distance > 20;
        joystick.left = angle > 3.927 && angle < 5.497 && distance > 20;
        joystick.right = angle > 0.785 && angle < 2.356 && distance > 20;
    });
    
    manager.on('end', () => {
        joystick.up = false;
        joystick.down = false;
        joystick.left = false;
        joystick.right = false;
    });
}

// Attack function
function attack() {
    // Check if any slimes are in range
    for (let slime of slimes) {
        if (Phaser.Math.Distance.Between(player.x, player.y, slime.x, slime.y) < 100) {
            // Damage slime
            slime.health -= playerStats.attackDamage;
            
            if (slime.health <= 0) {
                // Slime died
                slime.destroy();
                slimes = slimes.filter(s => s !== slime);
                
                // Gain XP
                playerStats.xp += 10;
                if (playerStats.xp >= playerStats.nextLevel) {
                    playerStats.level++;
                    playerStats.xp -= playerStats.nextLevel;
                    playerStats.nextLevel = Math.floor(playerStats.nextLevel * 1.5);
                    playerStats.maxHealth += 20;
                    playerStats.health = playerStats.maxHealth;
                    playerStats.attackDamage += 5;
                }
            }
        }
    }
    
    updateUI();
}

// Spawn slimes at night
function spawnSlimes() {
    let scene = game.scene.scenes[0];
    
    for (let i = 0; i < 20; i++) {
        let slime = scene.physics.add.sprite(
            Phaser.Math.Between(0, worldWidth),
            Phaser.Math.Between(0, worldHeight),
            'slime'
        );
        slime.setScale(0.5);
        slime.health = 10;
        slime.damage = 5;
        slime.attackCooldown = false;
        
        slimes.push(slime);
    }
}

// Remove slimes at day
function removeSlimes() {
    for (let slime of slimes) {
        slime.destroy();
    }
    slimes = [];
}

// Update slimes behavior
function updateSlimes() {
    let scene = game.scene.scenes[0];
    
    for (let slime of slimes) {
        // Move toward player
        scene.physics.moveToObject(slime, player, 50);
        
        // Check if slime is attacking player
        if (Phaser.Math.Distance.Between(player.x, player.y, slime.x, slime.y) < 50 && !slime.attackCooldown) {
            playerStats.health -= slime.damage;
            slime.attackCooldown = true;
            scene.time.delayedCall(1000, () => { slime.attackCooldown = false; });
            
            if (playerStats.health <= 0) {
                playerDie();
            }
            
            updateUI();
        }
    }
}

// Player death
function playerDie() {
    isDead = true;
    player.setVisible(false);
    document.getElementById('respawn-btn').style.display = 'block';
}

// Respawn player
function respawnPlayer() {
    isDead = false;
    playerStats.health = playerStats.maxHealth;
    player.setVisible(true);
    document.getElementById('respawn-btn').style.display = 'none';
    updateUI();
}

// Toggle inventory visibility
function toggleInventory() {
    let inventory = document.getElementById('inventory');
    inventory.style.display = inventory.style.display === 'none' ? 'block' : 'none';
}

// Update UI elements
function updateUI() {
    document.getElementById('health').textContent = playerStats.health;
    document.getElementById('level').textContent = playerStats.level;
    document.getElementById('xp').textContent = playerStats.xp;
    document.getElementById('next-level').textContent = playerStats.nextLevel;
    document.getElementById('wood-count').textContent = inventory.wood;
    document.getElementById('stone-count').textContent = inventory.stone;
}
