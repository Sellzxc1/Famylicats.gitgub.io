const MIN_DISTANCE_BETWEEN_TREES = 150;
const MIN_DISTANCE_BETWEEN_ROCKS = 100;
const TREE_ROCK_MIN_DISTANCE = 120;

function spawnInitialResources(width, height) {
    // Spawn trees (меньше деревьев)
    const treeCount = 5;
    for (let i = 0; i < treeCount; i++) {
        let x, y, attempts = 0;
        let validPosition = false;
        
        while (!validPosition && attempts < 100) {
            attempts++;
            x = Math.random() * (width - 100) + 50;
            y = Math.random() * (height - 200) + 100;
            validPosition = true;
            
            for (const tree of gameState.resources.trees) {
                const dx = tree.x - x;
                const dy = tree.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < MIN_DISTANCE_BETWEEN_TREES) {
                    validPosition = false;
                    break;
                }
            }
            
            for (const rock of gameState.resources.rocks) {
                const dx = rock.x - x;
                const dy = rock.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < TREE_ROCK_MIN_DISTANCE) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        if (validPosition) {
            gameState.resources.trees.push({
                x: x,
                y: y,
                width: 60,
                height: 80,
                collected: false,
                respawnTime: 0
            });
        }
    }
    
    // Spawn rocks (камни появляются реже)
    const rockCount = 7;
    for (let i = 0; i < rockCount; i++) {
        let x, y, attempts = 0;
        let validPosition = false;
        
        while (!validPosition && attempts < 100) {
            attempts++;
            x = Math.random() * (width - 100) + 50;
            y = Math.random() * (height - 200) + 100;
            validPosition = true;
            
            for (const rock of gameState.resources.rocks) {
                const dx = rock.x - x;
                const dy = rock.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < MIN_DISTANCE_BETWEEN_ROCKS) {
                    validPosition = false;
                    break;
                }
            }
            
            for (const tree of gameState.resources.trees) {
                const dx = tree.x - x;
                const dy = tree.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < TREE_ROCK_MIN_DISTANCE) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        if (validPosition) {
            gameState.resources.rocks.push({
                x: x,
                y: y,
                width: 50,
                height: 40,
                collected: false,
                respawnTime: 0
            });
        }
    }
}

function respawnResources(now) {
    // Respawn trees
    for (const tree of gameState.resources.trees) {
        if (tree.collected && now >= tree.respawnTime) {
            tree.collected = false;
        }
    }
    
    // Respawn rocks
    for (const rock of gameState.resources.rocks) {
        if (rock.collected && now >= rock.respawnTime) {
            rock.collected = false;
        }
    }
}
