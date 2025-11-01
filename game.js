// Game variables
let scene, camera, renderer;
let court, hoop, backboard, ball;
let keys = {};
let ballInPlay = false;
let ballVelocity = { x: 0, y: 0, z: 0 };
let playerPosition = { x: 0, y: 1.8, z: 0 }; // Start at mid-court, eye level
let playerAngle = Math.PI; // Rotation angle (facing -z direction where hoop is)
let moveSpeed = 0.1;
let rotateSpeed = 0.03;
let score = 0;
let scoreJustScored = false;
let scoreAnimationTime = 0;
let hoopPosition = { x: 0, y: 10, z: -42 };
let particles = [];

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    
    // Create camera (first-person view)
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(playerPosition.x, playerPosition.y, playerPosition.z);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight - 160); // Account for control panel
    renderer.shadowMap.enabled = true;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Create basketball court
    createCourt();
    
    // Create basketball hoop
    createHoop();
    
    // Event listeners
    setupEventListeners();
    
    // Start game loop
    animate();
}

function createCourt() {
    const courtGroup = new THREE.Group();
    
    // Court floor (brown wooden)
    const floorGeometry = new THREE.PlaneGeometry(50, 94); // NBA court dimensions in feet (scaled)
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    courtGroup.add(floor);
    
    // Court lines (white)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    
    // Center circle
    const circleShape = new THREE.Shape();
    circleShape.absarc(0, 0, 12, 0, Math.PI * 2, false);
    const circleGeometry = new THREE.ShapeGeometry(circleShape);
    const circle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.01;
    courtGroup.add(circle);
    
    // Mid-court line
    const midCourtLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.01, -47),
        new THREE.Vector3(0, 0.01, 47)
    ]);
    const midCourtLine = new THREE.Line(midCourtLineGeometry, lineMaterial);
    courtGroup.add(midCourtLine);
    
    // Free throw lines
    const freeThrowShape = new THREE.Shape();
    freeThrowShape.moveTo(-12, -19);
    freeThrowShape.lineTo(-12, 19);
    freeThrowShape.lineTo(12, 19);
    freeThrowShape.lineTo(12, -19);
    const freeThrowGeometry = new THREE.ShapeGeometry(freeThrowShape);
    const freeThrow = new THREE.Mesh(freeThrowGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    freeThrow.rotation.x = -Math.PI / 2;
    freeThrow.position.set(0, 0.01, -28);
    courtGroup.add(freeThrow);
    
    const freeThrow2 = freeThrow.clone();
    freeThrow2.position.set(0, 0.01, 28);
    courtGroup.add(freeThrow2);
    
    // Three-point arcs (simplified)
    const threePointShape1 = new THREE.Shape();
    threePointShape1.absarc(0, 0, 23.75, 0, Math.PI, true);
    threePointShape1.lineTo(0, -28);
    threePointShape1.lineTo(0, -47);
    const threePointGeometry1 = new THREE.ShapeGeometry(threePointShape1);
    const threePoint1 = new THREE.Mesh(threePointGeometry1, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    threePoint1.rotation.x = -Math.PI / 2;
    threePoint1.position.set(0, 0.01, -47);
    courtGroup.add(threePoint1);
    
    const threePoint2 = threePoint1.clone();
    threePoint2.position.set(0, 0.01, 47);
    courtGroup.add(threePoint2);
    
    courtGroup.position.set(0, 0, 0);
    scene.add(courtGroup);
    court = courtGroup;
}

function createHoop() {
    const hoopGroup = new THREE.Group();
    
    // Backboard (white rectangle)
    const backboardGeometry = new THREE.PlaneGeometry(6, 3.5);
    const backboardMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const backboardMesh = new THREE.Mesh(backboardGeometry, backboardMaterial);
    backboardMesh.position.set(0, 10, -42); // At one end of the court
    backboardMesh.rotation.y = Math.PI;
    backboardMesh.receiveShadow = true;
    hoopGroup.add(backboardMesh);
    
    // Rim (orange)
    const rimGeometry = new THREE.TorusGeometry(0.75, 0.05, 16, 32);
    const rimMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(0, 10, -42);
    rim.rotation.x = Math.PI / 2;
    hoopGroup.add(rim);
    
    // Net (simplified as wireframe)
    const netGeometry = new THREE.ConeGeometry(0.7, 1.5, 16);
    const netMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        wireframe: true,
        transparent: true,
        opacity: 0.7
    });
    const net = new THREE.Mesh(netGeometry, netMaterial);
    net.position.set(0, 9.25, -42);
    hoopGroup.add(net);
    
    // Support pole
    const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 10, 16);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(0, 5, -42);
    hoopGroup.add(pole);
    
    scene.add(hoopGroup);
    hoop = rim;
    backboard = backboardMesh;
}

function createBall() {
    const ballGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const ballMaterial = new THREE.MeshLambertMaterial({ color: 0xff8800 });
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.castShadow = true;
    scene.add(ballMesh);
    return ballMesh;
}

function shoot() {
    if (ballInPlay) return;
    
    ballInPlay = true;
    
    // Create ball if it doesn't exist
    if (!ball) {
        ball = createBall();
    }
    
    // Position ball in front of player (in the direction they're facing)
    const forwardX = -Math.sin(playerAngle);
    const forwardZ = -Math.cos(playerAngle);
    ball.position.set(
        playerPosition.x + forwardX * 1.0,
        playerPosition.y + 0.5,
        playerPosition.z + forwardZ * 1.0
    );
    
    // AUTO-AIM: Calculate direction to hoop for easy scoring
    const dx = hoopPosition.x - ball.position.x;
    const dy = hoopPosition.y - ball.position.y;
    const dz = hoopPosition.z - ball.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Normalize direction to hoop
    const toHoopX = dx / distance;
    const toHoopY = dy / distance;
    const toHoopZ = dz / distance;
    
    // Calculate shooting power - make it easy to reach the hoop
    const shootPower = distance * 0.08; // Auto-adjust power based on distance
    const shootHeight = Math.max(0.6, toHoopY * shootPower * 0.8); // Higher arc for easier scoring
    
    // Set initial velocity aimed at hoop (with slight randomness for variety)
    ballVelocity.x = toHoopX * shootPower + (Math.random() - 0.5) * 0.2;
    ballVelocity.y = shootHeight;
    ballVelocity.z = toHoopZ * shootPower + (Math.random() - 0.5) * 0.2;
    
    // Make ball visible if it was hidden
    ball.position.y = Math.max(ball.position.y, 0.5);
    
    // Update shoot button
    document.getElementById('shoot-btn').classList.add('active');
    setTimeout(() => {
        document.getElementById('shoot-btn').classList.remove('active');
    }, 200);
}

function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        if (e.code === 'Space') {
            e.preventDefault();
            shoot();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    // Button controls (swapped to fix reversal)
    document.getElementById('forward-btn').addEventListener('mousedown', () => {
        keys['KeyS'] = true;
        keys['ArrowDown'] = true;
    });
    document.getElementById('forward-btn').addEventListener('mouseup', () => {
        keys['KeyS'] = false;
        keys['ArrowDown'] = false;
    });
    document.getElementById('forward-btn').addEventListener('mouseleave', () => {
        keys['KeyS'] = false;
        keys['ArrowDown'] = false;
    });
    
    document.getElementById('back-btn').addEventListener('mousedown', () => {
        keys['KeyW'] = true;
        keys['ArrowUp'] = true;
    });
    document.getElementById('back-btn').addEventListener('mouseup', () => {
        keys['KeyW'] = false;
        keys['ArrowUp'] = false;
    });
    document.getElementById('back-btn').addEventListener('mouseleave', () => {
        keys['KeyW'] = false;
        keys['ArrowUp'] = false;
    });
    
    document.getElementById('left-btn').addEventListener('mousedown', () => {
        keys['KeyD'] = true;
        keys['ArrowRight'] = true;
    });
    document.getElementById('left-btn').addEventListener('mouseup', () => {
        keys['KeyD'] = false;
        keys['ArrowRight'] = false;
    });
    document.getElementById('left-btn').addEventListener('mouseleave', () => {
        keys['KeyD'] = false;
        keys['ArrowRight'] = false;
    });
    
    document.getElementById('right-btn').addEventListener('mousedown', () => {
        keys['KeyA'] = true;
        keys['ArrowLeft'] = true;
    });
    document.getElementById('right-btn').addEventListener('mouseup', () => {
        keys['KeyA'] = false;
        keys['ArrowLeft'] = false;
    });
    document.getElementById('right-btn').addEventListener('mouseleave', () => {
        keys['KeyA'] = false;
        keys['ArrowLeft'] = false;
    });
    
    document.getElementById('shoot-btn').addEventListener('click', shoot);
    
    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight - 160);
    });
}

function updatePlayerMovement() {
    let moved = false;
    
    // Forward/Back movement (reversed because camera faces -z initially)
    if (keys['KeyW'] || keys['ArrowUp']) {
        playerPosition.x -= Math.sin(playerAngle) * moveSpeed;
        playerPosition.z -= Math.cos(playerAngle) * moveSpeed;
        moved = true;
        document.getElementById('forward-btn').classList.add('active');
    } else {
        document.getElementById('forward-btn').classList.remove('active');
    }
    
    if (keys['KeyS'] || keys['ArrowDown']) {
        playerPosition.x += Math.sin(playerAngle) * moveSpeed;
        playerPosition.z += Math.cos(playerAngle) * moveSpeed;
        moved = true;
        document.getElementById('back-btn').classList.add('active');
    } else {
        document.getElementById('back-btn').classList.remove('active');
    }
    
    // Rotation (Left/Right - reversed)
    if (keys['KeyA'] || keys['ArrowLeft']) {
        playerAngle += rotateSpeed;
        moved = true;
        document.getElementById('left-btn').classList.add('active');
    } else {
        document.getElementById('left-btn').classList.remove('active');
    }
    
    if (keys['KeyD'] || keys['ArrowRight']) {
        playerAngle -= rotateSpeed;
        moved = true;
        document.getElementById('right-btn').classList.add('active');
    } else {
        document.getElementById('right-btn').classList.remove('active');
    }
    
    // Keep player on court
    playerPosition.x = Math.max(-20, Math.min(20, playerPosition.x));
    playerPosition.z = Math.max(-45, Math.min(45, playerPosition.z));
    
    // Update camera position and rotation
    camera.position.set(playerPosition.x, playerPosition.y, playerPosition.z);
    camera.rotation.y = playerAngle;
}

function updateBall() {
    if (!ballInPlay || !ball) return;
    
    // Apply gravity
    ballVelocity.y -= 0.02;
    
    // Update ball position
    ball.position.x += ballVelocity.x;
    ball.position.y += ballVelocity.y;
    ball.position.z += ballVelocity.z;
    
    // Ball collision with ground
    if (ball.position.y < 0.4) {
        ball.position.y = 0.4;
        ballVelocity.y *= -0.6; // Bounce with damping
        ballVelocity.x *= 0.9;
        ballVelocity.z *= 0.9;
        
        // Stop ball if velocity is too low
        if (Math.abs(ballVelocity.y) < 0.05 && Math.abs(ballVelocity.x) < 0.05 && Math.abs(ballVelocity.z) < 0.05) {
            ballInPlay = false;
            ballVelocity = { x: 0, y: 0, z: 0 };
        }
    }
    
    // Check if ball went through hoop (easy detection for scoring)
    const hoopPos = new THREE.Vector3(hoopPosition.x, hoopPosition.y, hoopPosition.z);
    const distanceToHoop = ball.position.distanceTo(hoopPos);
    
    // Make scoring detection easier and more forgiving
    if (distanceToHoop < 2.0 && ball.position.y > 9.0 && ball.position.y < 11.0) {
        // Ball is near hoop - check if it passed through (larger tolerance)
        if (Math.abs(ball.position.x - hoopPosition.x) < 1.2 && 
            Math.abs(ball.position.z - hoopPosition.z) < 1.2 &&
            ball.position.y > 9.5 && ball.position.y < 10.5 &&
            ballVelocity.y < 0) { // Ball must be falling through
            // Score!
            score++;
            scoreJustScored = true;
            scoreAnimationTime = 60; // 1 second at 60fps
            ballInPlay = false;
            
            // Update score display
            document.getElementById('score').textContent = score;
            
            // Show "Good job!" message
            const goodJobMsg = document.getElementById('good-job');
            goodJobMsg.style.display = 'block';
            goodJobMsg.style.opacity = '1';
            goodJobMsg.style.transform = 'scale(1.2)';
            
            // Create celebration particles
            createScoreParticles(hoopPos);
            
            // Hide message after animation
            setTimeout(() => {
                goodJobMsg.style.opacity = '0';
                goodJobMsg.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    goodJobMsg.style.display = 'none';
                }, 500);
            }, 2000);
            
            // Reset ball
            ball.position.set(0, -10, 0);
            ballVelocity = { x: 0, y: 0, z: 0 };
        }
    }
    
    // Reset ball if it goes out of bounds or hits the ground too many times
    if (ball.position.y < -5 || Math.abs(ball.position.x) > 30 || Math.abs(ball.position.z) > 50) {
        ballInPlay = false;
        ball.position.set(0, -10, 0); // Hide ball
        ballVelocity = { x: 0, y: 0, z: 0 };
    }
}

function createScoreParticles(position) {
    // Create colorful particles for celebration
    for (let i = 0; i < 30; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const colors = [0xff6600, 0xffaa00, 0xffff00, 0x00ff00, 0x00aaff];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const particleMaterial = new THREE.MeshBasicMaterial({ color: color });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            Math.random() * 0.5 + 0.3,
            (Math.random() - 0.5) * 0.5
        );
        particle.life = 1.0;
        
        scene.add(particle);
        particles.push(particle);
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.position.add(particle.velocity);
        particle.velocity.y -= 0.02; // Gravity
        particle.life -= 0.02;
        particle.scale.multiplyScalar(0.98);
        
        if (particle.life <= 0 || particle.position.y < 0) {
            scene.remove(particle);
            particles.splice(i, 1);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    updatePlayerMovement();
    updateBall();
    updateParticles();
    
    // Animate score message if just scored
    if (scoreJustScored && scoreAnimationTime > 0) {
        scoreAnimationTime--;
        if (scoreAnimationTime === 0) {
            scoreJustScored = false;
        }
    }
    
    renderer.render(scene, camera);
}

// Start the game when page loads
window.addEventListener('load', init);

