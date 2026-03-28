import React from "react";
import './index.css';
import { Game } from './engine/Game';
import { createRoot } from 'react-dom/client';
import { LoadingScreen } from './components/LoadingScreen';

async function init() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const overlay = document.getElementById('ui-overlay') as HTMLElement;

  if (!canvas || !overlay) {
    throw new Error('Required elements not found');
  }

  if (!navigator.gpu) {
    showWebGPUError();
    return;
  }

  showLoadingScreen(overlay, async () => {
    try {
      const game = new Game(canvas);
      await game.initialize();
      game.start();
    } catch (error) {
      console.error('Failed to initialize game:', error);
      showWebGPUError();
    }
  });
}

function showLoadingScreen(container: HTMLElement, onComplete: () => Promise<void>) {
  const root = createRoot(container);
  root.render(
    <LoadingScreen onLoadComplete={async () => {
      await onComplete();
      root.unmount();
    }} />
  );
}

function showWebGPUError() {
  const overlay = document.getElementById('ui-overlay');
  if (overlay) {
    overlay.innerHTML = `
      <div class="error-screen">
        <div class="glitch-text">SYSTEM ERROR</div>
        <div class="error-message">
          <p>WebGPU not supported</p>
          <p class="small">Chrome 113+ or Firefox Nightly required</p>
          <p class="small">Enable WebGPU in browser flags</p>
        </div>
      </div>
    `;
  }
}

if (typeof window !== 'undefined') {
  init();
}
