const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let cellSize = 28;
let maze = [];
let mazeWidth = 21;
let mazeHeight = 21;

let player = { x: 1, y: 1, px: 0, py: 0, speed: 2.2 };
let goal = { x: 0, y: 0 };

let timeLeft = 20;
let level = 1;
let gameRunning = true;

const timerDisplay = document.getElementById("timer");

/* ---------------- Maze Generation (DFS) ---------------- */

function generateMaze(w, h) {
    if (w % 2 === 0) w++;
    if (h % 2 === 0) h++;

    let grid = Array.from({ length: h }, () => Array(w).fill(1));

    function carve(x, y) {
        grid[y][x] = 0;
        let dirs = [
            [2, 0],
            [-2, 0],
            [0, 2],
            [0, -2]
        ];
        dirs.sort(() => Math.random() - 0.5);

        for (let [dx, dy] of dirs) {
            let nx = x + dx;
            let ny = y + dy;

            if (ny > 0 && ny < h - 1 && nx > 0 && nx < w - 1 && grid[ny][nx] === 1) {
                grid[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny);
            }
        }
    }

    carve(1, 1);
    return grid;
}

/* ---------------- Virtual Joystick ---------------- */

const base = document.getElementById("joystick-base");
const knob = document.getElementById("joystick-knob");

let joyX = 0, joyY = 0;
let dragging = false;

base.addEventListener("touchstart", startDrag);
base.addEventListener("touchmove", drag);
base.addEventListener("touchend", endDrag);

function startDrag(e) {
    dragging = true;
}

function drag(e) {
    if (!dragging) return;

    let rect = base.getBoundingClientRect();
    let x = e.touches[0].clientX - rect.left - 70;
    let y = e.touches[0].clientY - rect.top - 70;

    let dist = Math.sqrt(x * x + y * y);
    let maxDist = 50;

    if (dist > maxDist) {
        x = (x / dist) * maxDist;
        y = (y / dist) * maxDist;
    }

    knob.style.left = (x + 40) + "px";
    knob.style.top = (y + 40) + "px";

    joyX = x / maxDist;
    joyY = y / maxDist;
}

function endDrag() {
    dragging = false;
    knob.style.left = "40px";
    knob.style.top = "40px";
    joyX = 0;
    joyY = 0;
}

/* ---------------- Timer ---------------- */

function updateTimer() {
    if (!gameRunning) return;

    timerDisplay.textContent = "Time: " + timeLeft;

    if (timeLeft <= 0) {
        alert("Time's up!");
        gameRunning = false;
        return;
    }

    timeLeft--;
    setTimeout(updateTimer, 1000);
}

/* ---------------- Game Loop ---------------- */

function update() {
    if (!gameRunning) return;

    let nx = player.px + joyX * player.speed;
    let ny = player.py + joyY * player.speed;

    if (!collides(nx, player.py)) player.px = nx;
    if (!collides(player.px, ny)) player.py = ny;

    if (Math.hypot(player.px - goal.x * cellSize, player.py - goal.y * cellSize) < 20) {
        level++;
        startLevel();
    }

    draw();
    requestAnimationFrame(update);
}

function collides(px, py) {
    let gx = Math.floor(px / cellSize);
    let gy = Math.floor(py / cellSize);
    return maze[gy]?.[gx] === 1;
}

/* ---------------- Drawing ---------------- */

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.shadowBlur = 15;
    ctx.shadowColor = "cyan";

    for (let y = 0; y < mazeHeight; y++) {
        for (let x = 0; x < mazeWidth; x++) {
            if (maze[y][x] === 1) {
                ctx.fillStyle = "#00aaff";
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }

    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(player.px, player.py, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(goal.x * cellSize + cellSize / 2, goal.y * cellSize + cellSize / 2, 12, 0, Math.PI * 2);
    ctx.fill();
}

/* ---------------- Level Setup ---------------- */

function startLevel() {
    mazeWidth = 21 + level * 2;
    mazeHeight = 21 + level * 2;

    maze = generateMaze(mazeWidth, mazeHeight);

    player.px = cellSize;
    player.py = cellSize;

    let farthest = { x: 1, y: 1, d: 0 };

    for (let y = 0; y < mazeHeight; y++) {
        for (let x = 0; x < mazeWidth; x++) {
            if (maze[y][x] === 0) {
                let d = Math.abs(x - 1) + Math.abs(y - 1);
                if (d > farthest.d) {
                    farthest = { x, y, d };
                }
            }
        }
    }

    goal.x = farthest.x;
    goal.y = farthest.y;

    timeLeft = 20 + level * 2;
    updateTimer();
}

/* ---------------- Start Game ---------------- */

startLevel();
update();
