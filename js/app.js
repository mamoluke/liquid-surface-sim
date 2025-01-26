// Three.js 基本セットアップ
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 環境光
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

// 水面を作成
const waterGeometry = new THREE.PlaneGeometry(100, 100);
const water = new THREE.Water(waterGeometry, {
  color: 0x001e0f,
  scale: 2,
  flowDirection: new THREE.Vector2(1, 1),
  textureWidth: 1024,
  textureHeight: 1024
});
water.rotation.x = -Math.PI / 2;
scene.add(water);

// カメラ設定
camera.position.set(0, 10, 30);
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  water.material.uniforms['time'].value += 0.03;
  controls.update();
  renderer.render(scene, camera);
}
animate();

// リサイズ対応
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
