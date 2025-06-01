const textures = {
    player: new Image(),
    slime: new Image(),
    tree: new Image(),
    rock: new Image(),
    platform: new Image()
};

function loadTextures() {
    textures.player.src = 'assets/player.png';
    textures.slime.src = 'assets/slime.png';
    textures.tree.src = 'assets/tree.png';
    textures.rock.src = 'assets/rock.png';
    textures.platform.src = 'assets/trava.png';
}

function render(ctx, width, height) {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw platform (ground) with grass texture
    if (textures.platform.complete) {
        const platformPattern = ctx.createPattern(textures.platform, 'repeat');
        ctx.fillStyle = platformPattern;
        ctx.fillRect(0, height - 50, width, 50);
    } else {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, height - 50, width, 50);
    }
    
    // Draw resources
    for (const tree of gameState.resources.trees) {
        if (!tree.collected && textures.tree.complete) {
            ctx.drawImage(textures.tree, tree.x, tree.y, tree.width, tree.height);
        }
    }
    
    for (const rock of gameState.resources.rocks) {
        if (!rock.collected && textures.rock.complete) {
            ctx.drawImage(textures.rock, rock.x, rock.y, rock.width, rock.height);
        }
    }
    
    // Draw slimes
    for (const slime of gameState.slimes) {
        if (textures.slime.complete) {
            ctx.drawImage(textures.slime, slime.x, slime.y, slime.width, slime.height);
        }
    }
    
    // Draw player
    if (textures.player.complete) {
        ctx.drawImage(textures.player, gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);
    }
}
