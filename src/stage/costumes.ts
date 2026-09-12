import type { CostumeKind } from "../project/types";

export function drawCostume(
  ctx: CanvasRenderingContext2D,
  kind: CostumeKind,
  size: number,
): void {
  ctx.save();
  ctx.scale(size / 100, size / 100);
  switch (kind) {
    case "cat":
      drawCat(ctx);
      break;
    case "ball":
      drawBall(ctx);
      break;
    case "star":
      drawStar(ctx);
      break;
    case "cube":
      drawCube(ctx);
      break;
    case "ghost":
      drawGhost(ctx);
      break;
    case "rocket":
      drawRocket(ctx);
      break;
  }
  ctx.restore();
}

function drawCat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#f4a259";
  ctx.beginPath();
  ctx.ellipse(0, 6, 28, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-22, -10);
  ctx.lineTo(-14, -32);
  ctx.lineTo(-4, -12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(22, -10);
  ctx.lineTo(14, -32);
  ctx.lineTo(4, -12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffd7ba";
  ctx.beginPath();
  ctx.ellipse(-12, -18, 4, 5, -0.4, 0, Math.PI * 2);
  ctx.ellipse(12, -18, 4, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(-10, 2, 7, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(10, 2, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2b2f38";
  ctx.beginPath();
  ctx.arc(-9, 3, 3.2, 0, Math.PI * 2);
  ctx.arc(9, 3, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-8, 2, 1.1, 0, Math.PI * 2);
  ctx.arc(10, 2, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e76f51";
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(-4, 12);
  ctx.lineTo(4, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#2b2f38";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-28, 8);
  ctx.lineTo(-12, 10);
  ctx.moveTo(-28, 14);
  ctx.lineTo(-12, 12);
  ctx.moveTo(28, 8);
  ctx.lineTo(12, 10);
  ctx.moveTo(28, 14);
  ctx.lineTo(12, 12);
  ctx.stroke();
  ctx.strokeStyle = "#f4a259";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(24, 12);
  ctx.quadraticCurveTo(40, 4, 36, -10);
  ctx.stroke();
}

function drawBall(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createRadialGradient(-8, -10, 4, 0, 0, 28);
  g.addColorStop(0, "#ffe08a");
  g.addColorStop(0.45, "#f4a259");
  g.addColorStop(1, "#c1121f");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-4, -6, 18, -0.4, 1.2);
  ctx.stroke();
}

function drawStar(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = Math.cos(a) * 28;
    const y = Math.sin(a) * 28;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff3bf";
  ctx.beginPath();
  ctx.arc(-4, -6, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawCube(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#4C97FF";
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(26, -8);
  ctx.lineTo(26, 18);
  ctx.lineTo(0, 32);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3373CC";
  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.lineTo(-26, 18);
  ctx.lineTo(-26, -8);
  ctx.lineTo(0, -22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#7eb8ff";
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(26, -8);
  ctx.lineTo(0, 6);
  ctx.lineTo(-26, -8);
  ctx.closePath();
  ctx.fill();
}

function drawGhost(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#bde0fe";
  ctx.beginPath();
  ctx.arc(0, -4, 22, Math.PI, 0);
  ctx.lineTo(22, 24);
  ctx.lineTo(14, 16);
  ctx.lineTo(6, 24);
  ctx.lineTo(0, 16);
  ctx.lineTo(-6, 24);
  ctx.lineTo(-14, 16);
  ctx.lineTo(-22, 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(-8, -4, 6, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(8, -4, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1d3557";
  ctx.beginPath();
  ctx.arc(-6, -3, 3, 0, Math.PI * 2);
  ctx.arc(10, -3, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawRocket(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#e63946";
  ctx.beginPath();
  ctx.moveTo(-18, 16);
  ctx.lineTo(-6, 4);
  ctx.lineTo(-6, 20);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, 16);
  ctx.lineTo(6, 4);
  ctx.lineTo(6, 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f1faee";
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.quadraticCurveTo(16, 4, 8, 26);
  ctx.lineTo(-8, 26);
  ctx.quadraticCurveTo(-16, 4, 0, -30);
  ctx.fill();
  ctx.fillStyle = "#457b9d";
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffb703";
  ctx.beginPath();
  ctx.moveTo(-5, 26);
  ctx.lineTo(0, 36);
  ctx.lineTo(5, 26);
  ctx.closePath();
  ctx.fill();
}
