function updatePlayer() {
    const player = gameState.player;
    const canvas = document.getElementById('game-canvas');
    
    if (gameState.controls.left) player.x -= player.speed;
    if (gameState.controls.right) player.x += player.speed;
    if (gameState.controls.up) player.y -= player.speed;
    if (gameState.controls.down) player.y += player.speed;
    
    // Keep player in bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function checkRockCollection() {
    const player = gameState.player;
    
    for (const rock of gameState.resources.rocks) {
        if (!rock.collected && checkCollision(player, rock)) {
            rock.collected = true;
            rock.respawnTime = Date.now() + RESOURCE_RESPAWN_TIME;
            gameState.player.inventory.stone++;
            updateInventoryUI();
        }
    }
}
