// 万有引力定数 (G) [m³/(kg·s²)]
const G = 6.67430e-11;

// 天文学的単位 (AU) をメートルに変換する係数
const AU_TO_M = 1.496e+11;

// 太陽系の天体データ
const celestialBodies = {
    "Sun": { mass: 1.989e30, x: 0, y: 0, color: 'yellow', size: 30 },

    // 惑星に軌道周期（地球日）を追加
    "Mercury": { mass: 3.30e23, orbitRadius: 0.39, color: 'gray', size: 5, period: 88 },
    "Venus": { mass: 4.87e24, orbitRadius: 0.72, color: 'orange', size: 8, period: 225 },
    "Earth": { mass: 5.97e24, orbitRadius: 1.0, color: 'blue', size: 8, period: 365 },
    "Mars": { mass: 6.42e23, orbitRadius: 1.52, color: 'red', size: 6, period: 687 },
    "Jupiter": { mass: 1.90e27, orbitRadius: 5.20, color: 'brown', size: 14, period: 4333 },
    "Saturn": { mass: 5.68e26, orbitRadius: 9.58, color: 'goldenrod', size: 12, period: 10759 },
    "Uranus": { mass: 8.68e25, orbitRadius: 19.22, color: 'lightblue', size: 10, period: 30689 },
    "Neptune": { mass: 1.02e26, orbitRadius: 30.05, color: 'darkblue', size: 10, period: 60182 }
};

// スケール設定
let SCALE = 10; // AUをピクセルに変換する係数

const container = document.getElementById('solarSystem');
const universe = document.getElementById('universe');

// ズームとパンの設定
let scale = 1;
let minScale = 0.5;
let maxScale = 50;
let translateX = 0;
let translateY = 0;
let isPanning = false;
let startX = 0;
let startY = 0;
let isDragging = false;

// 公転アニメーションの設定
let animationRunning = true;
let lastRenderTime = 0;

// 時間のスケール（値を変更すると惑星の動きが速くなります）
const timeScale = 100000; // 値を大きくすると公転が速くなります

// アニメーションフレームID
let animationFrameId;

// 太陽系の天体を描画
function drawSolarSystem() {
    // 凡例を作成
    const legend = document.getElementById('legend');
    legend.innerHTML = '';
    for (let body in celestialBodies) {
        let celestialBody = celestialBodies[body];
        let div = document.createElement('div');
        div.classList.add('planet');

        div.style.backgroundColor = celestialBody.color;

        // 惑星の初期サイズを設定
        celestialBody.element = div; // DOM要素を保存
        celestialBody.baseSize = celestialBody.size;

        // 天体を配置 (位置は後で設定)
        div.style.position = 'absolute';
        div.style.width = `${celestialBody.baseSize}px`;
        div.style.height = `${celestialBody.baseSize}px`;

        // 要素の中心を基準に位置を調整
        div.style.transformOrigin = 'center';

        // 天体を中央に配置（初期位置）
        div.style.left = `${container.clientWidth / 2}px`;
        div.style.top = `${container.clientHeight / 2}px`;

        // ツールチップを追加
        div.title = body;

        // 天体を追加
        universe.appendChild(div);

        // ラベルを作成
        let label = document.createElement('span');
        label.classList.add('planet-label');
        label.textContent = body;

        // ラベルの初期フォントサイズを保存
        celestialBody.label = label;
        celestialBody.baseFontSize = 12; // 初期フォントサイズ（px）

        // ラベルを中央に配置（初期位置）
        label.style.position = 'absolute';
        label.style.left = `${container.clientWidth / 2}px`;
        label.style.top = `${container.clientHeight / 2}px`;
        label.style.transformOrigin = 'left center';

        universe.appendChild(label);

        // 初期角度を設定
        if (body !== 'Sun') {
            celestialBody.angle = Math.random() * 2 * Math.PI; // ランダムな初期位置
        }

        // 凡例を作成
        if (body !== 'Sun') {
            let legendItem = document.createElement('div');
            legendItem.classList.add('legend-item');

            let colorBox = document.createElement('div');
            colorBox.classList.add('legend-color');
            colorBox.style.backgroundColor = celestialBody.color;

            let name = document.createElement('span');
            name.textContent = body;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(name);
            legend.appendChild(legendItem);
        }
    }
}

drawSolarSystem();
updateTransform();
startAnimation();

// ズーム機能の実装
container.addEventListener('wheel', function(event) {
    event.preventDefault();

    let mouseX = event.clientX - container.getBoundingClientRect().left;
    let mouseY = event.clientY - container.getBoundingClientRect().top;

    let wheel = event.deltaY < 0 ? 1 : -1;
    let zoomIntensity = 0.1;
    let zoomFactor = (1 + wheel * zoomIntensity);

    let newScale = scale * zoomFactor;
    newScale = Math.min(Math.max(minScale, newScale), maxScale);

    // マウス位置に合わせて移動
    translateX -= (mouseX - container.clientWidth / 2 - translateX) * (zoomFactor - 1);
    translateY -= (mouseY - container.clientHeight / 2 - translateY) * (zoomFactor - 1);

    scale = newScale;

    updateTransform();
});

// パン機能の実装
container.addEventListener('mousedown', function(event) {
    isPanning = true;
    isDragging = false;
    startX = event.clientX;
    startY = event.clientY;
    container.style.cursor = 'grabbing';
});

container.addEventListener('mousemove', function(event) {
    if (!isPanning) return;

    isDragging = true;

    let dx = event.clientX - startX;
    let dy = event.clientY - startY;

    translateX += dx;
    translateY += dy;

    startX = event.clientX;
    startY = event.clientY;

    updateTransform();
});

container.addEventListener('mouseup', function(event) {
    isPanning = false;
    container.style.cursor = 'grab';
});

container.addEventListener('mouseleave', function(event) {
    isPanning = false;
    container.style.cursor = 'grab';
});

// クリックイベントの設定
container.addEventListener('click', function(event) {
    // パン中のクリックを無視
    if (isDragging) {
        isDragging = false;
        return;
    }

    const rect = container.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    // スケールと移動を考慮した位置
    const x = (offsetX - container.clientWidth / 2 - translateX) / (SCALE * scale);
    const y = (offsetY - container.clientHeight / 2 - translateY) / (SCALE * scale);

    // 各天体からの重力加速度を計算
    const results = calculateGravitationalAcceleration(x, y);

    // 結果を表示
    displayResults(x, y, results);
});

function calculateGravitationalAcceleration(x, y) {
    let results = [];

    for (let body in celestialBodies) {
        const mass = celestialBodies[body].mass;
        const bodyX = celestialBodies[body].x;
        const bodyY = celestialBodies[body].y;

        // 距離を計算（AU単位）
        const dx = bodyX - x;
        const dy = bodyY - y;
        const distanceAU = Math.sqrt(dx * dx + dy * dy);

        // 距離をメートルに変換
        const distanceM = distanceAU * AU_TO_M;

        // 重力加速度を計算 (m/s²)
        let acceleration = 0;
        if (distanceM > 0) {
            acceleration = G * mass / (distanceM * distanceM);
        }

        results.push({
            body: body,
            acceleration: acceleration
        });
    }

    // 重力加速度の大きい順にソート
    results.sort((a, b) => b.acceleration - a.acceleration);

    return results;
}

function displayResults(x, y, results) {
    const resultDiv = document.getElementById('result');

    // 既存の結果をクリア
    resultDiv.innerHTML = '';

    // 位置情報を表示
    const positionInfo = document.createElement('h2');
    positionInfo.textContent = `位置 (${x.toFixed(4)} AU, ${y.toFixed(4)} AU) の重力加速度`;
    resultDiv.appendChild(positionInfo);

    // 結果をテーブルで表示
    const table = document.createElement('table');
    const header = document.createElement('tr');
    const headerBody = document.createElement('th');
    headerBody.textContent = '天体';
    const headerAcceleration = document.createElement('th');
    headerAcceleration.textContent = '重力加速度 (m/s²)';
    header.appendChild(headerBody);
    header.appendChild(headerAcceleration);
    table.appendChild(header);

    results.forEach(item => {
        const row = document.createElement('tr');
        const cellBody = document.createElement('td');
        cellBody.textContent = item.body;
        const cellAcceleration = document.createElement('td');
        cellAcceleration.textContent = item.acceleration.toExponential(3);
        row.appendChild(cellBody);
        row.appendChild(cellAcceleration);
        table.appendChild(row);
    });

    resultDiv.appendChild(table);
}

function updateTransform() {
    // universe の transform を更新
    universe.style.transform = `translate(${translateX + container.clientWidth / 2}px, ${translateY + container.clientHeight / 2}px) scale(${scale})`;
    universe.style.transformOrigin = `0 0`;

    // 惑星とラベルの位置を更新
    for (let body in celestialBodies) {
        let celestialBody = celestialBodies[body];

        let x, y;
        if (body === 'Sun') {
            x = 0;
            y = 0;
        } else {
            // 公転運動に基づく位置計算
            const orbitRadius = celestialBody.orbitRadius;
            celestialBody.x = Math.cos(celestialBody.angle) * orbitRadius;
            celestialBody.y = Math.sin(celestialBody.angle) * orbitRadius;

            x = celestialBody.x * SCALE;
            y = celestialBody.y * SCALE;
        }

        // 要素の位置を更新（中心基準）
        celestialBody.element.style.transform = `translate(${x}px, ${y}px)`;
        celestialBody.element.style.transformOrigin = 'center';

        // ラベルの位置を更新（左上基準）
        celestialBody.label.style.transform = `translate(${x + celestialBody.baseSize / 2 + 5}px, ${y - celestialBody.baseFontSize / 2}px)`;
        celestialBody.label.style.transformOrigin = 'left center';
    }
}

// 公転アニメーションの開始
function startAnimation() {
    animationRunning = true;
    lastRenderTime = performance.now();
    animate();
}

// 公転アニメーションの停止
function stopAnimation() {
    animationRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

// アニメーション関数
function animate(time) {
    if (!animationRunning) return;

    // 経過時間の計算
    const deltaTime = time - lastRenderTime;
    lastRenderTime = time;

    // 各惑星の角度を更新
    for (let body in celestialBodies) {
        let celestialBody = celestialBodies[body];
        if (body === 'Sun') continue;

        // 角速度の計算（単位時間あたりの角度の変化量）
        const angularSpeed = (2 * Math.PI) / (celestialBody.period * 24 * 3600 * 1000); // [rad/ms]
        celestialBody.angle += angularSpeed * deltaTime * timeScale;

        // 角度を0～2πの範囲に収める
        celestialBody.angle %= 2 * Math.PI;
    }

    // 位置と表示を更新
    updateTransform();

    // 次のフレームをリクエスト
    animationFrameId = requestAnimationFrame(animate);
}

// 停止・再生ボタンの設定
const toggleButton = document.getElementById('toggleAnimation');
toggleButton.addEventListener('click', function() {
    if (animationRunning) {
        stopAnimation();
        toggleButton.textContent = '公転を再生';
    } else {
        startAnimation();
        toggleButton.textContent = '公転を停止';
    }
});