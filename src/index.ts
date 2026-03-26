/**
 * OBIX Polygaltic Demo — src/index.ts
 *
 * Pure OBIX runtime UI (no React, no Vue).
 * State is owned by ObixRuntime; DOM is updated via innerHTML on every
 * UPDATED lifecycle event.  LibPolyCall telemetry is logged to the console
 * in the same way the original index.js did, ready for libpolycall-v1 IPC.
 *
 * Runtime action contract:
 *   ObixRuntime.update(id, actionName, ...args) → action(...args): Partial<S>
 *   Current state must be read via getInstance() before dispatch if needed.
 */

import { ObixRuntime, LifecycleHook } from '@obinexusltd/obix';
import type { LifecycleHandler } from '@obinexusltd/obix';

// ---------------------------------------------------------------------------
// Component state shape
// ---------------------------------------------------------------------------

interface CounterState {
  count: number;
  lang: 'TypeScript' | 'Rust' | 'Go' | 'Python';
  polyCallSynced: boolean;
  lastAction: string;
}

// ---------------------------------------------------------------------------
// Runtime — disable aggressive halting for a long-running UI
// ---------------------------------------------------------------------------

const runtime = new ObixRuntime({
  maxRevisions: 10_000,
  stabilityThreshold: 500,  // UI allows repeated identical states (e.g. rapid +1)
  haltOnPolicyViolation: false,
});

// ---------------------------------------------------------------------------
// Component definition
// ---------------------------------------------------------------------------

runtime.register<CounterState>({
  name: 'PolygalticCounter',

  state: {
    count: 0,
    lang: 'TypeScript',
    polyCallSynced: false,
    lastAction: 'init',
  },

  actions: {
    // args: [currentCount]  — caller reads state before dispatch
    increment: (currentCount: number) => ({
      count: currentCount + 1,
      lastAction: 'increment',
      polyCallSynced: false,
    }),
    decrement: (currentCount: number) => ({
      count: currentCount - 1,
      lastAction: 'decrement',
      polyCallSynced: false,
    }),
    reset: () => ({
      count: 0,
      lastAction: 'reset',
      polyCallSynced: false,
    }),
    // args: [currentLang]
    switchLang: (currentLang: CounterState['lang']) => {
      const langs: Array<CounterState['lang']> = ['TypeScript', 'Rust', 'Go', 'Python'];
      const next = langs[(langs.indexOf(currentLang) + 1) % langs.length];
      return { lang: next, lastAction: 'switchLang', polyCallSynced: false };
    },
    syncPolyCall: () => ({
      polyCallSynced: true,
      lastAction: 'syncPolyCall',
    }),
  },

  render: (state: CounterState) => `
    <div class="obix-counter">
      <header>
        <h1>OBIX × LibPolyCall</h1>
        <span class="badge">${state.polyCallSynced ? '🔗 synced' : '⏳ local'}</span>
      </header>

      <div class="display">
        <span class="count" id="obix-count">${state.count}</span>
      </div>

      <div class="controls">
        <button id="obix-decrement">−</button>
        <button id="obix-reset">Reset</button>
        <button id="obix-increment">+</button>
      </div>

      <div class="meta">
        <p>Binding: <strong id="obix-lang">${state.lang}</strong>
          <button id="obix-switch-lang">Switch →</button>
        </p>
        <p>Last action: <code>${state.lastAction}</code></p>
        <p>Powered by <code>@obinexusltd/obix</code> + LibPolyCall v1</p>
      </div>

      <div class="polycall-log" id="obix-log">
        <small>PolyCall telemetry — open DevTools console for full trace</small>
      </div>
    </div>
  `,
});

// ---------------------------------------------------------------------------
// Create instance
// ---------------------------------------------------------------------------

const instance = runtime.create<CounterState>('PolygalticCounter');
const instanceId = instance.id;

// ---------------------------------------------------------------------------
// DOM mount helper
// ---------------------------------------------------------------------------

function getState(): CounterState {
  const inst = runtime.getInstance<CounterState>(instanceId);
  if (!inst) throw new Error('[OBIX] instance not found');
  return inst.currentState;
}

function mount(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const state = getState();
  app.innerHTML = instance.definition.render(state) as string;

  // Attach event listeners after every render
  document.getElementById('obix-increment')
    ?.addEventListener('click', () => dispatch('increment', getState().count));

  document.getElementById('obix-decrement')
    ?.addEventListener('click', () => dispatch('decrement', getState().count));

  document.getElementById('obix-reset')
    ?.addEventListener('click', () => dispatch('reset'));

  document.getElementById('obix-switch-lang')
    ?.addEventListener('click', () => dispatch('switchLang', getState().lang));
}

// ---------------------------------------------------------------------------
// Dispatch helper — resumes halted component transparently
// ---------------------------------------------------------------------------

function dispatch(actionName: string, ...args: unknown[]): void {
  const inst = runtime.getInstance<CounterState>(instanceId);
  if (inst?.halted) runtime.resume(instanceId);
  runtime.update<CounterState>(instanceId, actionName, ...(args as []));
}

// ---------------------------------------------------------------------------
// Lifecycle subscription — re-render on state update
// ---------------------------------------------------------------------------

const lifecycleHandler: LifecycleHandler = (event) => {
  if (event.instanceId !== instanceId) return;

  // LibPolyCall telemetry hook (mirrors original index.js pattern)
  console.log(
    '%c[PolyCall Telemetry]',
    'color:#0ff;font-weight:bold',
    { hook: event.hook, state: (event.instance as { currentState?: unknown })?.currentState }
  );

  if (event.hook === LifecycleHook.UPDATED || event.hook === LifecycleHook.CREATED) {
    mount();
  }

  // Dispatch a polycall sync on every 10th update
  const state = getState();
  if (state.count !== 0 && state.count % 10 === 0 && !state.polyCallSynced) {
    dispatch('syncPolyCall');
  }
};

runtime.onLifecycle(lifecycleHandler);

// ---------------------------------------------------------------------------
// Initial render
// ---------------------------------------------------------------------------

mount();
