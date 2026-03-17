const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

// ── 컬러 ──
const BG = '#0A0E1A';        // 진한 네이비-블랙
const CARD = '#141B2D';      // 카드 배경
const GREEN = '#00D959';     // 네온 그린
const GREEN2 = '#00B84D';    // 그린 변형
const WHITE = '#FFFFFF';
const GRAY = '#2A3142';

// ═══════════════════════════════════════
// 1. 앱 아이콘 (1024x1024) - 미니멀 차트 로고
// ═══════════════════════════════════════
function generateAppIcon() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 배경 (둥근 사각형 느낌의 그라데이션)
  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, '#0D1321');
  bgGrad.addColorStop(1, '#0A0E1A');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // 미묘한 기하학 패턴 (배경 장식)
  ctx.strokeStyle = 'rgba(0,217,89,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const y = 120 + i * 110;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // 중앙 원형 글로우 효과
  const glow = ctx.createRadialGradient(512, 512, 100, 512, 512, 450);
  glow.addColorStop(0, 'rgba(0,217,89,0.12)');
  glow.addColorStop(1, 'rgba(0,217,89,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // 상승 차트 바 (3개)
  const barWidth = 80;
  const barGap = 40;
  const bars = [
    { h: 220, x: 512 - barWidth * 1.5 - barGap },
    { h: 340, x: 512 - barWidth * 0.5 },
    { h: 480, x: 512 + barWidth * 0.5 + barGap },
  ];
  const barBottom = 680;

  bars.forEach((bar, i) => {
    // 바 그라데이션
    const barGrad = ctx.createLinearGradient(0, barBottom - bar.h, 0, barBottom);
    barGrad.addColorStop(0, GREEN);
    barGrad.addColorStop(1, GREEN2);
    ctx.fillStyle = barGrad;

    // 둥근 상단
    const r = 16;
    const x = bar.x;
    const y = barBottom - bar.h;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barWidth - r, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
    ctx.lineTo(x + barWidth, barBottom);
    ctx.lineTo(x, barBottom);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();
  });

  // 상승 화살표 (↗)
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(310, 520);
  ctx.lineTo(512, 340);
  ctx.lineTo(714, 260);
  ctx.stroke();

  // 화살표 끝
  ctx.beginPath();
  ctx.moveTo(660, 250);
  ctx.lineTo(714, 260);
  ctx.lineTo(704, 314);
  ctx.stroke();

  // 하단 "AI" 텍스트
  ctx.fillStyle = GREEN;
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('AI', 512, 800);

  // 하단 얇은 라인
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(440, 820);
  ctx.lineTo(584, 820);
  ctx.stroke();

  // 저장
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, 'icon.png'), buf);
  fs.writeFileSync(path.join(ASSETS, 'favicon.png'), buf);
  fs.writeFileSync(path.join(ASSETS, 'android-icon-foreground.png'), buf);
  console.log('앱 아이콘 생성 완료!');
}

// ═══════════════════════════════════════
// 2. Android 배경 아이콘 (단색)
// ═══════════════════════════════════════
function generateAndroidBg() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, size, size);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, 'android-icon-background.png'), buf);
  console.log('Android 배경 아이콘 생성 완료!');
}

// ═══════════════════════════════════════
// 3. Monochrome 아이콘
// ═══════════════════════════════════════
function generateMonochrome() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  // 같은 차트 바 (흰색)
  const barWidth = 80;
  const barGap = 40;
  const bars = [
    { h: 220, x: 512 - barWidth * 1.5 - barGap },
    { h: 340, x: 512 - barWidth * 0.5 },
    { h: 480, x: 512 + barWidth * 0.5 + barGap },
  ];
  const barBottom = 680;

  bars.forEach((bar) => {
    ctx.fillStyle = WHITE;
    const r = 16;
    const x = bar.x;
    const y = barBottom - bar.h;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barWidth - r, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
    ctx.lineTo(x + barWidth, barBottom);
    ctx.lineTo(x, barBottom);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();
  });

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, 'android-icon-monochrome.png'), buf);
  console.log('Monochrome 아이콘 생성 완료!');
}

// ═══════════════════════════════════════
// 4. 스플래시 아이콘 (200x200 중앙 로고)
// ═══════════════════════════════════════
function generateSplashIcon() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 투명 배경 (splash backgroundColor가 따로 설정됨)
  ctx.clearRect(0, 0, size, size);

  // 차트 바 (작은 버전)
  const barWidth = 40;
  const barGap = 20;
  const bars = [
    { h: 110, x: 256 - barWidth * 1.5 - barGap },
    { h: 170, x: 256 - barWidth * 0.5 },
    { h: 240, x: 256 + barWidth * 0.5 + barGap },
  ];
  const barBottom = 360;

  bars.forEach((bar) => {
    const barGrad = ctx.createLinearGradient(0, barBottom - bar.h, 0, barBottom);
    barGrad.addColorStop(0, GREEN);
    barGrad.addColorStop(1, GREEN2);
    ctx.fillStyle = barGrad;

    const r = 8;
    const x = bar.x;
    const y = barBottom - bar.h;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barWidth - r, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
    ctx.lineTo(x + barWidth, barBottom);
    ctx.lineTo(x, barBottom);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();
  });

  // 상승선
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(155, 280);
  ctx.lineTo(256, 180);
  ctx.lineTo(357, 140);
  ctx.stroke();

  // AI 텍스트
  ctx.fillStyle = GREEN;
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('AI', 256, 430);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, 'splash-icon.png'), buf);
  console.log('스플래시 아이콘 생성 완료!');
}

// ═══════════════════════════════════════
// 실행
// ═══════════════════════════════════════
generateAppIcon();
generateAndroidBg();
generateMonochrome();
generateSplashIcon();
console.log('\n모든 에셋 생성 완료!');
