const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const pointLight = new THREE.PointLight(0x99ccff, 2, 100);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.background = 'rgba(0, 0, 0, 0.7)';
tooltip.style.color = 'white';
tooltip.style.padding = '4px 8px';
tooltip.style.borderRadius = '4px';
tooltip.style.pointerEvents = 'none';
tooltip.style.display = 'none';
tooltip.style.fontSize = '14px';
document.body.appendChild(tooltip);

const pauseButton = document.createElement('button');
pauseButton.id = 'pauseButton';
pauseButton.innerText = '⏸ Pause';
document.body.appendChild(pauseButton);

const resetButton = document.createElement('button');
resetButton.id = 'resetButton';
resetButton.innerText = '🔄 Reset View';
document.body.appendChild(resetButton);

const sunCanvas = document.createElement('canvas');
sunCanvas.width = sunCanvas.height = 128;
const sunCtx = sunCanvas.getContext('2d');
sunCtx.fillStyle = 'white';
sunCtx.fillRect(0, 0, sunCanvas.width, sunCanvas.height);
sunCtx.font = '100px serif';
sunCtx.textAlign = 'center';
sunCtx.textBaseline = 'middle';
sunCtx.fillText('☀️', sunCanvas.width / 2, sunCanvas.height / 2);
const sunTexture = new THREE.CanvasTexture(sunCanvas);
const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.userData = { name: 'Sun' };
scene.add(sunMesh);

const planetData = [
  { name: 'Mercury', emoji: '🪨', radius: 3, size: 0.2 },
  { name: 'Venus', emoji: '🌕', radius: 4.5, size: 0.4 },
  { name: 'Earth', emoji: '🌍', radius: 6, size: 0.5 },
  { name: 'Mars', emoji: '🔥', radius: 7.5, size: 0.4 },
  { name: 'Jupiter', emoji: '🪐', radius: 10, size: 1.1 },
  { name: 'Saturn', emoji: '💍', radius: 12, size: 0.9 },
  { name: 'Uranus', emoji: '🌀', radius: 13.5, size: 0.6 },
  { name: 'Neptune', emoji: '🌊', radius: 15, size: 0.6 },
];

const canvas = document.createElement('canvas');
canvas.width = canvas.height = 128;
const ctx = canvas.getContext('2d');

function createEmojiTexture(emoji, label) {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '60px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = '20px sans-serif';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 40);
  return new THREE.CanvasTexture(canvas);
}

const planets = [];
const speeds = {};
const controls = document.getElementById('controls');

planetData.forEach((data, index) => {
  const texture = createEmojiTexture(data.emoji, data.name);
  const geometry = new THREE.SphereGeometry(data.size, 32, 32);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = { name: data.name };
  scene.add(mesh);

  planets.push({ mesh, radius: data.radius, angle: 0, name: data.name });
  speeds[data.name] = 0.01 + index * 0.002;

  const label = document.createElement('label');
  label.innerHTML = `<span class="emoji-label">${data.emoji}</span> ${data.name}`;
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0.001';
  slider.max = '0.05';
  slider.step = '0.001';
  slider.value = speeds[data.name];
  slider.addEventListener('input', (e) => {
    speeds[data.name] = parseFloat(e.target.value);
  });
  controls.appendChild(label);
  controls.appendChild(slider);
});

camera.position.z = 20;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseX = 0;
let mouseY = 0;

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  mouseX = event.clientX;
  mouseY = event.clientY;
}
window.addEventListener('mousemove', onMouseMove, false);

let isPaused = false;
document.getElementById('pauseButton').addEventListener('click', () => {
  isPaused = !isPaused;
  pauseButton.innerText = isPaused ? '▶️ Play' : '⏸ Pause';
});

resetButton.addEventListener('click', () => {
  const targetPos = new THREE.Vector3(0, 0, 0);
  const startPos = camera.position.clone();
  const endPos = new THREE.Vector3(0, 0, 20);
  const duration = 1000;
  let startTime = null;

  function animateReset(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = Math.min(elapsed / duration, 1);

    camera.position.lerpVectors(startPos, endPos, t);
    camera.lookAt(targetPos);

    if (t < 1) requestAnimationFrame(animateReset);
  }

  requestAnimationFrame(animateReset);
});

window.addEventListener('click', () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh).concat(sunMesh));
  if (intersects.length > 0) {
    const target = intersects[0].object;
    const targetPos = target.position.clone();
    camera.position.set(targetPos.x, targetPos.y + 2, targetPos.z + 3);
    camera.lookAt(targetPos);
  }
});

function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    planets.forEach(p => {
      p.angle += speeds[p.name];
      p.mesh.position.set(
        Math.cos(p.angle) * p.radius,
        0,
        Math.sin(p.angle) * p.radius
      );
    });
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

  if (intersects.length > 0) {
    const planet = intersects[0].object;
    tooltip.innerText = planet.userData.name;
    tooltip.style.left = `${mouseX + 10}px`;
    tooltip.style.top = `${mouseY + 10}px`;
    tooltip.style.display = 'block';
  } else {
    tooltip.style.display = 'none';
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});