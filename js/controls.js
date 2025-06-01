function initControls() {
    const joystickBase = document.getElementById('joystick-base');
    const joystickHandle = document.getElementById('joystick-handle');
    let joystickActive = false;
    let joystickCenter = { x: 0, y: 0 };
    let joystickPosition = { x: 0, y: 0 };
    
    function handleJoystickStart(e) {
        joystickActive = true;
        const rect = joystickBase.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        handleJoystickMove(e);
    }
    
    function handleJoystickMove(e) {
        if (!joystickActive) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        joystickPosition = {
            x: clientX - joystickCenter.x,
            y: clientY - joystickCenter.y
        };
        
        const maxDistance = joystickBase.offsetWidth / 2;
        const distance = Math.sqrt(joystickPosition.x * joystickPosition.x + joystickPosition.y * joystickPosition.y);
        
        if (distance > maxDistance) {
            joystickPosition.x = (joystickPosition.x / distance) * maxDistance;
            joystickPosition.y = (joystickPosition.y / distance) * maxDistance;
        }
        
        joystickHandle.style.transform = `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`;
        
        const deadzone = 10;
        gameState.controls.left = joystickPosition.x < -deadzone;
        gameState.controls.right = joystickPosition.x > deadzone;
        gameState.controls.up = joystickPosition.y < -deadzone;
        gameState.controls.down = joystickPosition.y > deadzone;
    }
    
    function handleJoystickEnd() {
        joystickActive = false;
        joystickHandle.style.transform = 'translate(0, 0)';
        gameState.controls.left = false;
        gameState.controls.right = false;
        gameState.controls.up = false;
        gameState.controls.down = false;
    }
    
    joystickBase.addEventListener('mousedown', handleJoystickStart);
    joystickBase.addEventListener('touchstart', handleJoystickStart);
    
    document.addEventListener('mousemove', handleJoystickMove);
    document.addEventListener('touchmove', handleJoystickMove);
    
    document.addEventListener('mouseup', handleJoystickEnd);
    document.addEventListener('touchend', handleJoystickEnd);
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
                gameState.controls.left = true;
                break;
            case 'ArrowRight':
            case 'd':
                gameState.controls.right = true;
                break;
            case 'ArrowUp':
            case 'w':
                gameState.controls.up = true;
                break;
            case 'ArrowDown':
            case 's':
                gameState.controls.down = true;
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
                gameState.controls.left = false;
                break;
            case 'ArrowRight':
            case 'd':
                gameState.controls.right = false;
                break;
            case 'ArrowUp':
            case 'w':
                gameState.controls.up = false;
                break;
            case 'ArrowDown':
            case 's':
                gameState.controls.down = false;
                break;
        }
    });
    
    // Click handler for trees
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        for (const tree of gameState.resources.trees) {
            if (!tree.collected && 
                clickX >= tree.x && clickX <= tree.x + tree.width &&
                clickY >= tree.y && clickY <= tree.y + tree.height) {
                tree.collected = true;
                tree.respawnTime = Date.now() + RESOURCE_RESPAWN_TIME;
                gameState.player.inventory.wood++;
                updateInventoryUI();
                break;
            }
        }
    });
}
