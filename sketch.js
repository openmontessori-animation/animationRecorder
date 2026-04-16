let path = [];
let recording = false;
let playing = false;
let playIndex = 0;
let renderLayer;
let smoothedX, smoothedY;
let studentName = "";
let animationTitle = "";
let exporting = false;

// POINTER
let pointerX = 0;
let pointerY = 0;
let isPointerDown = false;

// UI
let playBtn, exportBtn;
let smoothSlider;
let trailCheckbox;
let dotsCheckbox;
let onionCheckbox;

let logo;

// video export
let mediaRecorder;
let recordedChunks = [];
let recordingVideo = false;

// hatch settings
let hatchStep = 10;
let minMovement = 2;

function preload() {
  logo = loadImage("Logoi-800.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  textFont('Arial');
  textSize(12);

  renderLayer = createGraphics(width, height);

  // --- POINTER SETUP ---
  let c = document.querySelector("canvas");

  c.style.touchAction = "none";

c.addEventListener("touchmove", (e) => {
  e.preventDefault();
}, { passive: false });

  c.addEventListener("pointermove", (e) => {
    e.preventDefault();
    pointerX = e.clientX;
    pointerY = e.clientY;
  });

  c.addEventListener("pointerdown", (e) => {
    e.preventDefault();

    if (isPointerDown) return;
    isPointerDown = true;

    pointerX = e.clientX;
    pointerY = e.clientY;

    if (pointerX < 280 && pointerY < 180) return;

    if (e.pointerType === "mouse") {
      if (!recording) {
        startRecording();
      } else {
        stopRecording();
      }
    } else {
      startRecording();
    }
  });

  c.addEventListener("pointerup", (e) => {
    e.preventDefault();

    isPointerDown = false;

    if (e.pointerType !== "mouse") {
      stopRecording();
    }
  });

  // --- UI ---
  playBtn = createButton("Play");
  playBtn.position(30, 85);
  playBtn.mousePressed(startPlayback);

  exportBtn = createButton("Export");
  exportBtn.position(90, 85);
  exportBtn.mousePressed(exportVideo);

  smoothSlider = createSlider(0, 1, 0.5, 0.01);
  smoothSlider.position(80, 118);

  function styleCheckbox(cb) {
    cb.style('font-size', '12px');
    cb.style('font-family', 'Arial');
    cb.style('color', '#000');
  }

  trailCheckbox = createCheckbox("Trail", false);
  trailCheckbox.position(30, 148);
  styleCheckbox(trailCheckbox);

  dotsCheckbox = createCheckbox("Dots", false);
  dotsCheckbox.position(90, 148);
  styleCheckbox(dotsCheckbox);

  onionCheckbox = createCheckbox("Onion Skin", false);
  onionCheckbox.position(150, 148);
  styleCheckbox(onionCheckbox);
}

function draw() {
  background(255);


  

  // --- DRAW ---
  drawAnimation(this);
  drawUIBox();
image(logo, 20, 20, 60, 60);

  fill(0);
  noStroke();
  textSize(12);
  text("OPEN MONTESSORI", 90, 45);

  textSize(14);
  text("Animation Recorder", 90, 65);

  textSize(12);
  text("Smooth", 30, 130);
  renderLayer.background(255);
  drawAnimation(renderLayer);
  drawExportLabel(renderLayer);

  // --- PLAYBACK ---
  if (playing && path.length > 0) {
    playIndex++;
    if (playIndex >= path.length) {
      playing = false;
      playIndex = 0;

      if (recordingVideo) {
        mediaRecorder.stop();
        recordingVideo = false;
      }
    }
  }

  // --- RECORDING ---
  if (recording) {
    let dx = pointerX - smoothedX;
    let dy = pointerY - smoothedY;
    let speed2 = sqrt(dx * dx + dy * dy);

    let baseSmooth = map(smoothSlider.value(), 1, 0, 0.05, 0.5);
    let adaptiveSmooth = baseSmooth * map(speed2, 0, 20, 0.2, 1, true);

    smoothedX = lerp(smoothedX, pointerX, adaptiveSmooth);
    smoothedY = lerp(smoothedY, pointerY, adaptiveSmooth);

    path.push({ x: smoothedX, y: smoothedY });
  }
}

// --- RECORD CONTROL ---

function startRecording() {
  recording = true;
  playing = false;
  path = [];

  smoothedX = pointerX;
  smoothedY = pointerY;

  path.push({ x: smoothedX, y: smoothedY });
}

function stopRecording() {
  recording = false;
}

// --- DRAWING ---

function drawAnimation(g) {
  let showTrail = trailCheckbox.checked();
  let showDots = dotsCheckbox.checked();
  let showOnion = onionCheckbox.checked();

  if (showTrail && path.length > 1) {
    g.noFill();

    let minAlpha = 15;
    let maxAlpha = 60;

    for (let i = 1; i < path.length; i++) {
      let t = i / path.length;
      let alpha = lerp(minAlpha, maxAlpha, t * t);

      g.stroke(0, alpha);
      g.line(path[i - 1].x, path[i - 1].y, path[i].x, path[i].y);
    }
  }

  if (showDots && path.length > 1) {
    g.noStroke();
    g.fill(0, 50);
    for (let p of path) {
      g.circle(p.x, p.y, 3);
    }
  }
  
// --- HATCH MARKS (timing) ---
if (showTrail && path.length > hatchStep + 1) {
  g.stroke(0, 100);

  for (let i = hatchStep; i < path.length - 1; i += hatchStep) {
    let p = path[i];

    let pPrev = path[i - 1];
    let pNext = path[i + 1];

    let dx = pNext.x - pPrev.x;
    let dy = pNext.y - pPrev.y;

    let mag = sqrt(dx * dx + dy * dy);

    if (mag > minMovement) {
      let normalX = -dy / mag;
      let normalY = dx / mag;

      let pPast = path[i - hatchStep];
      let distVal = dist(p.x, p.y, pPast.x, pPast.y);

      let tickSize = map(distVal, 0, 40, 4, 14, true);

      g.line(
        p.x - normalX * tickSize,
        p.y - normalY * tickSize,
        p.x + normalX * tickSize,
        p.y + normalY * tickSize
      );
    }
  }
}
  if (showOnion && path.length > 1) {
    let onionCount = 10;
    let baseSize = 16;
    let minSize = 4;

    let currentIndex = playing ? playIndex : path.length - 1;

    for (let i = 1; i <= onionCount; i++) {
      let idx = currentIndex - i;

      if (idx >= 0) {
        let t = i / onionCount;
        let alpha = lerp(140, 5, t * t);
        let size = lerp(baseSize, minSize, t);

        g.noStroke();
        g.fill(0, alpha);

        let p = path[idx];
        g.circle(p.x, p.y, size);
      }
    }
  }

  g.fill(0);
  g.noStroke();

  if (playing && path.length > 0) {
    let p = path[playIndex];
    g.circle(p.x, p.y, 16);
  } else if (recording) {
    g.circle(smoothedX, smoothedY, 16);
  } else if (path.length > 0) {
    let last = path[path.length - 1];
    g.circle(last.x, last.y, 16);
  }
}

// --- UI BOX ---

function drawUIBox() {
  let x = 10;
  let y = 15;
  let w = 260;
  let h = 175;

// Background fill
noStroke();
fill(255);
rect(x, y, w, h, 6);

// Border on top
noFill();
stroke(200);
rect(x, y, w, h, 6);

  stroke(255);
  line(x + 1, y + 1, x + w - 1, y + 1);

  stroke(180);
  line(x + 1, y + h - 1, x + w - 1, y + h - 1);
}

// --- PLAYBACK ---

function startPlayback() {
  if (path.length > 0) {
    playing = true;
    recording = false;
    playIndex = 0;
  }
}

function keyPressed() {
  if (key === ' ') {
    startPlayback();
  }
}

// --- EXPORT (unchanged) ---

function exportVideo() {
  if (path.length === 0) return;

  animationTitle = prompt("Enter animation title:", "My Animation") || "Untitled";
  studentName = prompt("Enter student name:", "Student Name") || "Unknown";

  let stream = renderLayer.canvas.captureStream(30);

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = function(e) {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = function() {
    let blob = new Blob(recordedChunks, { type: 'video/webm' });

    let filename = `${animationTitle}_${studentName}.webm`;

    let url = URL.createObjectURL(blob);

    let a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);

    exporting = false;
  };

  exporting = true;
  playIndex = 0;
  playing = true;

  setTimeout(() => {
    mediaRecorder.start();
    recordingVideo = true;
  }, 200);
}

function drawExportLabel(g) {
  if (!exporting || !studentName) return;

  g.push();

  g.noStroke();
  g.textFont('Arial');
  g.textSize(14);
  g.textAlign(LEFT, BOTTOM);

  let margin = 20;

  g.fill(0, 130);
  g.text("Title: " + animationTitle, margin, g.height - 30);

  g.fill(0, 130);
  g.text("Name: " + studentName, margin, g.height - 10);

  g.pop();
}
