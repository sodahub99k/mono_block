import { STAGE_H, STAGE_W, type BackdropId } from "../project/types";
import type { EngineSnapshot, SpriteLive } from "../runtime/engine";
import { drawCostume } from "./costumes";

export function scratchToCanvas(x: number, y: number): { x: number; y: number } {
  return { x: STAGE_W / 2 + x, y: STAGE_H / 2 - y };
}

export function canvasToScratch(
  cx: number,
  cy: number,
  displayW: number,
  displayH: number,
): { x: number; y: number } {
  const x = (cx / displayW) * STAGE_W - STAGE_W / 2;
  const y = STAGE_H / 2 - (cy / displayH) * STAGE_H;
  return { x, y };
}

function drawBackdrop(ctx: CanvasRenderingContext2D, id: BackdropId): void {
  if (id === "sky") {
    const g = ctx.createLinearGradient(0, 0, 0, STAGE_H);
    g.addColorStop(0, "#8ecae6");
    g.addColorStop(0.55, "#caf0f8");
    g.addColorStop(1, "#90be6d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    cloud(ctx, 70, 50, 1);
    cloud(ctx, 300, 80, 1.2);
    cloud(ctx, 400, 40, 0.7);
    return;
  }
  if (id === "space") {
    ctx.fillStyle = "#070b16";
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 80; i++) {
      const x = (i * 97) % STAGE_W;
      const y = (i * 53) % STAGE_H;
      ctx.globalAlpha = 0.3 + ((i * 13) % 7) / 10;
      ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
    const planet = ctx.createRadialGradient(400, 80, 8, 400, 80, 50);
    planet.addColorStop(0, "#ffd166");
    planet.addColorStop(1, "rgba(255,140,66,0)");
    ctx.fillStyle = planet;
    ctx.beginPath();
    ctx.arc(400, 80, 50, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (id === "room") {
    ctx.fillStyle = "#f4f1de";
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.fillStyle = "#e9c46a";
    ctx.fillRect(0, 260, STAGE_W, 100);
    ctx.fillStyle = "#2a9d8f";
    ctx.fillRect(40, 80, 90, 180);
    ctx.fillStyle = "#264653";
    ctx.fillRect(58, 100, 54, 70);
    ctx.fillStyle = "#e76f51";
    ctx.fillRect(320, 140, 110, 120);
    return;
  }
  ctx.fillStyle = "#1a1f2b";
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= STAGE_W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, STAGE_H);
    ctx.stroke();
  }
  for (let y = 0; y <= STAGE_H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(STAGE_W, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.moveTo(STAGE_W / 2, 0);
  ctx.lineTo(STAGE_W / 2, STAGE_H);
  ctx.moveTo(0, STAGE_H / 2);
  ctx.lineTo(STAGE_W, STAGE_H / 2);
  ctx.stroke();
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
  ctx.arc(x + 18 * s, y + 4 * s, 20 * s, 0, Math.PI * 2);
  ctx.arc(x + 38 * s, y, 14 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawSprite(ctx: CanvasRenderingContext2D, s: SpriteLive): void {
  if (!s.visible) return;
  const { x, y } = scratchToCanvas(s.x, s.y);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(((-(s.direction - 90)) * Math.PI) / 180);
  const costume = s.costumes[s.costumeIndex] ?? s.costumes[0];
  if (costume) drawCostume(ctx, costume.kind, s.size);
  ctx.restore();

  if (s.say) {
    drawSay(ctx, x, y - 48 * (s.size / 100), s.say.text);
  }
}

function drawSay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
): void {
  ctx.font = "13px system-ui, sans-serif";
  const pad = 8;
  const w = Math.min(220, Math.max(48, ctx.measureText(text).width + pad * 2));
  const h = 28;
  const bx = x + 18;
  const by = y - 10;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#2b2f38";
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx + 10, by + h);
  ctx.lineTo(x + 8, y + 8);
  ctx.lineTo(bx + 22, by + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1b1e27";
  ctx.textBaseline = "middle";
  ctx.fillText(text, bx + pad, by + h / 2, w - pad * 2);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawMonitors(
  ctx: CanvasRenderingContext2D,
  snap: EngineSnapshot,
): void {
  let i = 0;
  for (const v of snap.variables) {
    if (!v.visible) continue;
    const x = 8;
    const y = 8 + i * 28;
    ctx.font = "12px system-ui, sans-serif";
    const label = `${v.name}: ${Math.round(v.value * 100) / 100}`;
    const w = Math.max(90, ctx.measureText(label).width + 16);
    ctx.fillStyle = "#ee7d16";
    roundRect(ctx, x, y, w, 22, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + 8, y + 11);
    i++;
  }
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  snap: EngineSnapshot,
): void {
  drawBackdrop(ctx, snap.backdrop);
  for (const s of snap.sprites) drawSprite(ctx, s);
  drawMonitors(ctx, snap);
}

export function snapshotFromProject(
  project: import("../project/types").Project,
): EngineSnapshot {
  return {
    backdrop: project.backdrop,
    mouse: { x: 0, y: 0 },
    variables: project.variables,
    sprites: project.sprites.map((s) => ({
      id: s.id,
      name: s.name,
      x: s.x,
      y: s.y,
      direction: s.direction,
      size: s.size,
      visible: s.visible,
      costumeIndex: s.costumeIndex,
      costumes: s.costumes,
      say: null,
    })),
  };
}
