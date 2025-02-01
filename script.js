// シーン、カメラ、レンダラー、クロック、メッシュなどのグローバル変数
let scene, camera, renderer, clock, waterMesh;
let uniforms;

init();
animate();

function init() {
  // シーンの作成
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // カメラの作成（視野角75°、アスペクト比、近遠クリッピング）
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 5, 5);
  camera.lookAt(0, 0, 0);

  // レンダラーの作成
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // クロックの作成
  clock = new THREE.Clock();

  // シェーダーに渡すユニフォーム
  uniforms = {
    time: { value: 0.0 },
    // クリック位置（x,z 座標）を保持する 2D ベクトル
    rippleCenter: { value: new THREE.Vector2(0.0, 0.0) },
    // リップル発生時刻。初期値は負の値としておく
    rippleTime: { value: -1.0 }
  };

  // カスタムシェーダー（頂点シェーダー）
  const vertexShader = `
    uniform float time;
    uniform vec2 rippleCenter;
    uniform float rippleTime;
    varying vec2 vUv;
    void main(){
      vUv = uv;
      vec3 pos = position;
      // 基本の波（しらぎれのような微細な動き）
      float wave = 0.1 * sin(pos.x * 2.0 + time) * cos(pos.z * 2.0 + time);
      float ripple = 0.0;
      // rippleTime が 0 以上の場合はクリックによる波を発生させる
      if(rippleTime >= 0.0) {
        float dt = time - rippleTime;
        float dist = length(vec2(pos.x, pos.z) - rippleCenter);
        // リップルは距離と時間により正弦波＋指数関数的に減衰
        ripple = sin(10.0 * dist - dt * 5.0) * exp(-2.0 * dt);
      }
      pos.y += wave + ripple;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  // カスタムシェーダー（フラグメントシェーダー）
  const fragmentShader = `
    uniform float time;
    varying vec2 vUv;
    void main(){
      // 水色のベースカラー
      vec3 waterColor = vec3(0.0, 0.5, 0.7);
      // UV座標と時間による微妙な輝き（シマー）
      float shimmer = 0.1 * sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
      gl_FragColor = vec4(waterColor + shimmer, 1.0);
    }
  `;

  // 広さ10×10、分割数を十分に取った平面ジオメトリ（水面用）
  const geometry = new THREE.PlaneGeometry(10, 10, 200, 200);
  // PlaneGeometry は初期は XY 平面なので、X軸周りに -90° 回転して XZ 平面にする
  geometry.rotateX(-Math.PI / 2);

  // シェーダーマテリアルの作成
  const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    // wireframe: true, // デバッグ時はワイヤーフレーム表示にすると形状が分かりやすい
  });

  // メッシュ作成とシーンへの追加
  waterMesh = new THREE.Mesh(geometry, material);
  scene.add(waterMesh);

  // クリック時にリップルを発生させるイベントリスナー
  window.addEventListener('click', onMouseClick, false);
  // ウィンドウリサイズ時の対応
  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseClick(event) {
  // 画面座標を正規化座標 (-1～1) に変換
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  // Raycaster を使い、水面との交点を取得
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(waterMesh);
  if(intersects.length > 0) {
    const point = intersects[0].point;
    // 交点の x,z 座標をリップル中心としてユニフォームに設定
    uniforms.rippleCenter.value.set(point.x, point.z);
    // リップル発生時刻を現在の time に設定
    uniforms.rippleTime.value = uniforms.time.value;
  }
}

function animate() {
  requestAnimationFrame(animate);
  // 経過時間をシェーダーのユニフォームに更新
  uniforms.time.value = clock.getElapsedTime();

  // 一定時間（ここでは2秒）経過したらリップル効果は打ち切る
  if(uniforms.rippleTime.value >= 0.0 && (uniforms.time.value - uniforms.rippleTime.value) > 2.0) {
    uniforms.rippleTime.value = -1.0;
  }

  renderer.render(scene, camera);
}
