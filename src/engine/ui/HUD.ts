import { RPGSystem } from '../rpg/RPGSystem';
import { PlayerController } from '../player/PlayerController';
import { World } from '../world/World';
import { CombatSystem } from '../combat/CombatSystem';

export class HUD {
  private container: HTMLElement;
  private rpgSystem: RPGSystem;
  private playerController: PlayerController;
  private world: World;
  private combatSystem: CombatSystem;
  private minimapCtx: CanvasRenderingContext2D | null = null;
  private minimapCanvas: HTMLCanvasElement | null = null;

  constructor(
    rpgSystem: RPGSystem,
    playerController: PlayerController,
    world: World,
    combatSystem: CombatSystem,
  ) {
    this.rpgSystem = rpgSystem;
    this.playerController = playerController;
    this.world = world;
    this.combatSystem = combatSystem;
    this.container = document.getElementById('hud')!;
    this.createHUD();
    this.initMinimap();
  }

  private createHUD() {
    this.container.innerHTML = `
      <div class="hud-root">

        <!-- Top left: objective -->
        <div class="hud-tl">
          <div class="obj-title">▶ MAIN OBJECTIVE</div>
          <div class="obj-text" id="obj-text">Explore Night City</div>
          <div class="obj-dist" id="obj-dist"></div>
        </div>

        <!-- Top right: money + wanted -->
        <div class="hud-tr">
          <div class="money-row">
            <span class="money-sym">€$</span>
            <span class="money-val" id="hud-money">1000</span>
          </div>
          <div class="wanted-row" id="hud-wanted">
            <span class="w-star dim">◆</span>
            <span class="w-star dim">◆</span>
            <span class="w-star dim">◆</span>
            <span class="w-star dim">◆</span>
            <span class="w-star dim">◆</span>
          </div>
        </div>

        <!-- Bottom left: minimap + bars -->
        <div class="hud-bl">
          <div class="minimap-wrap">
            <canvas id="minimap-canvas" width="180" height="180"></canvas>
          </div>
          <div class="bars">
            <div class="bar-row">
              <span class="bar-label">HP</span>
              <div class="bar-track">
                <div class="bar-fill hp-fill" id="hud-hp-fill" style="width:100%"></div>
              </div>
              <span class="bar-num" id="hud-hp-num">100</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">STA</span>
              <div class="bar-track">
                <div class="bar-fill sta-fill" id="hud-sta-fill" style="width:100%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom right: ammo -->
        <div class="hud-br">
          <div class="weapon-name" id="hud-weapon-name">M-10AF LEXINGTON</div>
          <div class="ammo-row">
            <span class="ammo-cur" id="hud-ammo-cur">30</span>
            <span class="ammo-sep">/</span>
            <span class="ammo-res" id="hud-ammo-res">90</span>
          </div>
          <div class="reload-hint" id="hud-reload" style="display:none">RELOADING...</div>
        </div>

        <!-- Crosshair -->
        <div class="crosshair" id="hud-crosshair">
          <div class="ch-line ch-top"></div>
          <div class="ch-line ch-bottom"></div>
          <div class="ch-line ch-left"></div>
          <div class="ch-line ch-right"></div>
        </div>

        <!-- Interaction prompt -->
        <div class="interact-prompt" id="interact-prompt" style="display:none">
          <span class="interact-key">[E]</span>
          <span class="interact-text">Interact</span>
        </div>

        <!-- Controls hint (shown until pointer lock) -->
        <div class="controls-hint" id="controls-hint">
          CLICK TO LOCK MOUSE &nbsp;|&nbsp; WASD MOVE &nbsp;|&nbsp; SHIFT SPRINT &nbsp;|&nbsp; SPACE JUMP &nbsp;|&nbsp; LMB SHOOT
        </div>

      </div>
    `;
  }

  private initMinimap() {
    this.minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    if (this.minimapCanvas) {
      this.minimapCtx = this.minimapCanvas.getContext('2d');
    }
  }

  update(_deltaTime: number) {
    const stats = this.rpgSystem.getPlayerStats();
    const weapon = this.combatSystem.getEquippedWeapon();

    // Health
    const hpFill = document.getElementById('hud-hp-fill');
    const hpNum  = document.getElementById('hud-hp-num');
    if (hpFill) hpFill.style.width = `${(stats.currentHealth / stats.maxHealth) * 100}%`;
    if (hpNum)  hpNum.textContent = `${Math.floor(stats.currentHealth)}`;

    // Money
    const moneyEl = document.getElementById('hud-money');
    if (moneyEl) moneyEl.textContent = stats.money.toLocaleString();

    // Ammo
    if (weapon) {
      const curEl    = document.getElementById('hud-ammo-cur');
      const resEl    = document.getElementById('hud-ammo-res');
      const reloadEl = document.getElementById('hud-reload');
      if (curEl) {
        curEl.textContent = weapon.currentAmmo.toString();
        curEl.style.color = weapon.currentAmmo === 0 ? '#FF003C' : '#FFEF00';
      }
      if (resEl) resEl.textContent = weapon.reserveAmmo.toString();
      if (reloadEl) reloadEl.style.display = weapon.isReloading ? 'block' : 'none';
    }

    // Controls hint — hide once pointer is locked
    const hint = document.getElementById('controls-hint');
    if (hint) hint.style.display = this.playerController.isLocked() ? 'none' : 'block';

    this.drawMinimap();
  }

  private drawMinimap() {
    const ctx = this.minimapCtx;
    const canvas = this.minimapCanvas;
    if (!ctx || !canvas) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const SCALE = 0.45; // world units per pixel

    const pos = this.playerController.getPosition();
    const px = pos[0], pz = pos[2];

    // Background
    ctx.fillStyle = '#04040e';
    ctx.fillRect(0, 0, W, H);

    // Circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 1, 0, Math.PI * 2);
    ctx.clip();

    // Grid lines (streets)
    const gridSize = 28; // matches CityGenerator gridSize in world units
    ctx.strokeStyle = 'rgba(255,239,0,0.06)';
    ctx.lineWidth = 0.5;
    const offsetX = ((px / SCALE) % (gridSize / SCALE) + W) % (gridSize / SCALE);
    const offsetZ = ((pz / SCALE) % (gridSize / SCALE) + H) % (gridSize / SCALE);
    for (let xi = -offsetX; xi < W; xi += gridSize / SCALE) {
      ctx.beginPath(); ctx.moveTo(xi, 0); ctx.lineTo(xi, H); ctx.stroke();
    }
    for (let zi = -offsetZ; zi < H; zi += gridSize / SCALE) {
      ctx.beginPath(); ctx.moveTo(0, zi); ctx.lineTo(W, zi); ctx.stroke();
    }

    // Buildings
    const buildings = this.world.getBuildings();
    for (const b of buildings) {
      const dx = (b.position[0] - px) / SCALE;
      const dz = (b.position[2] - pz) / SCALE;
      const mx = cx + dx;
      const my = cy + dz;
      if (mx < -10 || mx > W + 10 || my < -10 || my > H + 10) continue;

      const bw = Math.max(b.size[0] / SCALE, 1.5);
      const bh = Math.max(b.size[2] / SCALE, 1.5);

      if (b.emissive > 0) {
        const nr = Math.floor(b.color[0] * 255);
        const ng = Math.floor(b.color[1] * 255);
        const nb = Math.floor(b.color[2] * 255);
        ctx.fillStyle = `rgba(${nr},${ng},${nb},0.7)`;
      } else {
        ctx.fillStyle = 'rgba(40,40,55,0.85)';
      }
      ctx.fillRect(mx - bw / 2, my - bh / 2, bw, bh);
    }

    // Player marker — yellow triangle pointing in heading direction
    const yaw = this.playerController.getCameraYaw();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(yaw);
    ctx.fillStyle = '#FFEF00';
    ctx.shadowColor = '#FFEF00';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(3.5, 4);
    ctx.lineTo(-3.5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore(); // end clip

    // Border
    ctx.strokeStyle = '#FFEF0088';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 1, 0, Math.PI * 2);
    ctx.stroke();

    // Corner ticks
    ctx.strokeStyle = '#FFEF00';
    ctx.lineWidth = 1;
    for (const [tx, ty] of [[cx, 2], [cx, H-2], [2, cy], [W-2, cy]] as [number,number][]) {
      ctx.beginPath();
      if (ty === cy) { ctx.moveTo(tx, ty-3); ctx.lineTo(tx, ty+3); }
      else           { ctx.moveTo(tx-3, ty); ctx.lineTo(tx+3, ty); }
      ctx.stroke();
    }
  }

  showInteractionPrompt(text: string) {
    const el = document.getElementById('interact-prompt');
    if (!el) return;
    const t = el.querySelector('.interact-text');
    if (t) t.textContent = text;
    el.style.display = 'flex';
  }

  hideInteractionPrompt() {
    const el = document.getElementById('interact-prompt');
    if (el) el.style.display = 'none';
  }
}
