\# OBIX Runtime Demo — Polygaltic



> \*\*Live proof-of-concept for \[`@obinexusltd/obix`](https://github.com/obinexusmk2/obix).\*\*

> Pure data-oriented UI with no React, no Vue — just the OBIX Heart/Soul runtime and a single TypeScript component.



\---



\## What this is



The OBIX Heart/Soul philosophy treats UI state as a \*\*first-class data structure\*\*, not a side effect of a component tree. Every piece of state lives inside an `ObixRuntime` instance. Every interaction is a named action. The DOM is a projection — a read-only snapshot rendered from state on every `UPDATED` lifecycle event.



This demo makes that philosophy tangible:



\- One component (`PolygalticCounter`) registered with `ObixRuntime`

\- Five actions: `increment`, `decrement`, `reset`, `switchLang`, `syncPolyCall`

\- One lifecycle subscriber that re-renders `innerHTML` on every state change

\- LibPolyCall telemetry logged to the DevTools console on every update

\- Zero framework dependencies — `@obinexusltd/obix` is the only runtime dependency



It is the simplest possible proof that OBIX works as a standalone, browser-native UI engine.



\---



\## Heart/Soul architecture at a glance



```

&#x20;                   ┌─────────────────────────────────────┐

&#x20;                   │           ObixRuntime                │

&#x20;                   │                                      │

&#x20; User action  ───▶ │  update(id, actionName, ...args)     │

&#x20;                   │         │                            │

&#x20;                   │         ▼                            │

&#x20;                   │  action(...args) → Partial<State>    │

&#x20;                   │         │                            │

&#x20;                   │         ▼                            │

&#x20;                   │  StateHaltEngine.record()            │

&#x20;                   │  PolicyEngine.enforce()              │

&#x20;                   │         │                            │

&#x20;                   │         ▼                            │

&#x20;                   │  fireLifecycleHook(UPDATED)          │

&#x20;                   └────────────┬────────────────────────┘

&#x20;                                │

&#x20;                   onLifecycle  ▼

&#x20;                   ┌─────────────────────────┐

&#x20;                   │  render(state) → HTML   │

&#x20;                   │  #app.innerHTML = html  │

&#x20;                   └─────────────────────────┘

```



\*\*Heart\*\* = `ObixRuntime` — the engine that owns state, drives actions, and fires lifecycle hooks.

\*\*Soul\*\* = the component definition — a plain data object (`name`, `state`, `actions`, `render`). No classes, no decorators, no magic.



\---



\## Repository structure



```

obix-runtime-demo/

├── src/

│   └── index.ts          # Component definition + DOM mount

├── public/

│   ├── index.html        # Shell — <div id="app"> + <script type="module">

│   └── bundle.js         # Rollup output (committed for quick preview)

├── rollup.config.mjs     # Rollup 4 + @rollup/plugin-typescript

├── tsconfig.json         # moduleResolution: bundler, lib: ES2022+DOM

└── package.json

```



\---



\## Quick start



\*\*Requirements:\*\* Node.js ≥ 18



```bash

git clone https://github.com/obinexusmk2/obix-runtime-demo

cd obix-runtime-demo



npm install

npm run bundle        # src/index.ts → public/bundle.js

npx serve public      # http://localhost:3000

```



Or with Python (Conda/base):



```bash

python -m http.server 8080 --directory public

\# → http://localhost:8080

```



\---



\## Scripts



| Command | Description |

|---|---|

| `npm run bundle` | Build `public/bundle.js` via Rollup |

| `npm run bundle:watch` | Rebuild on file change |

| `npm run typecheck` | `tsc --noEmit` — type-check only, no emit |



\---



\## How it works



\### 1. Component definition (`src/index.ts`)



```typescript

import { ObixRuntime, LifecycleHook } from '@obinexusltd/obix';



const runtime = new ObixRuntime({

&#x20; maxRevisions: 10\_000,

&#x20; stabilityThreshold: 500,

&#x20; haltOnPolicyViolation: false,

});



runtime.register<CounterState>({

&#x20; name: 'PolygalticCounter',

&#x20; state: { count: 0, lang: 'TypeScript', polyCallSynced: false, lastAction: 'init' },

&#x20; actions: {

&#x20;   increment: (currentCount: number) => ({ count: currentCount + 1, lastAction: 'increment' }),

&#x20;   reset: () => ({ count: 0, lastAction: 'reset' }),

&#x20;   switchLang: (currentLang) => ({ lang: nextLang(currentLang), lastAction: 'switchLang' }),

&#x20;   syncPolyCall: () => ({ polyCallSynced: true, lastAction: 'syncPolyCall' }),

&#x20; },

&#x20; render: (state) => `<div>...</div>`, // returns HTML string

});

```



\### 2. Action dispatch



Because `ObixRuntime.update(id, actionName, ...args)` passes `args` directly to the action function, the caller reads current state before dispatch:



```typescript

function dispatch(actionName: string, ...args: unknown\[]) {

&#x20; const inst = runtime.getInstance(instanceId);

&#x20; if (inst?.halted) runtime.resume(instanceId);

&#x20; runtime.update(instanceId, actionName, ...args);

}



// Increment button:

btn.addEventListener('click', () => dispatch('increment', getState().count));

```



\### 3. Lifecycle → DOM



```typescript

runtime.onLifecycle((event) => {

&#x20; if (event.hook === LifecycleHook.UPDATED) mount();      // re-render DOM

&#x20; if (state.count % 10 === 0) dispatch('syncPolyCall');   // PolyCall sync

});

```



\### 4. LibPolyCall telemetry hook



Every state transition is logged as a structured event, ready for the libpolycall-v1 IPC daemon:



```typescript

console.log('%c\[PolyCall Telemetry]', 'color:#0ff;font-weight:bold', {

&#x20; hook: event.hook,

&#x20; state: event.instance?.currentState,

});

```



\---



\## StateHaltEngine



`ObixRuntime` ships a built-in `StateHaltEngine` that detects when state has stabilised across N consecutive identical revisions and halts the component to prevent runaway update loops. For a long-running UI, this is configured with a high `stabilityThreshold` (500). The `dispatch` helper calls `runtime.resume()` before each action so user interactions always go through.



This is the same mechanism that underpins the OBIX CLI's `applyAction` pattern — both the browser UI and the terminal tooling share the same runtime engine.



\---



\## Relation to the OBIX SDK



This demo is the consumer-facing proof of the full SDK published under `@obinexusltd`:



| Package | Role |

|---|---|

| \[`@obinexusltd/obix`](https://www.npmjs.com/package/@obinexusltd/obix) | Single install entry point |

| \[`@obinexusltd/obix-sdk-core`](https://www.npmjs.com/package/@obinexusltd/obix-sdk-core) | `ObixRuntime`, `StateHaltEngine`, `PolicyEngine` |

| \[`@obinexusltd/obix-sdk-cli`](https://www.npmjs.com/package/@obinexusltd/obix-sdk-cli) | `obix build / validate / migrate` CLI |

| `@obinexusltd/obix-driver-\*` | 10 platform drivers (DOM, GPU, network, input…) |

| `@obinexusltd/obix-binding-\*` | 10 language bindings (Rust, Go, Python, Swift…) |



The monorepo source lives at \[github.com/obinexusmk2/obix](https://github.com/obinexusmk2/obix).



\---



\## LibPolyCall v1



The `libpolycall-v1/` directory in this repo contains the C-based polymorphic call protocol library. It provides the cross-language state synchronisation layer that the `syncPolyCall` action is designed to hook into — bridging the JavaScript runtime to Rust, Go, Python, or any other OBIX binding over a lightweight IPC protocol.



\---



\## Author



\*\*Nnamdi Okpala\*\* — OBINexus

\[okpalan@protonmail.com](mailto:okpalan@protonmail.com)

\[github.com/obinexusmk2](https://github.com/obinexusmk2)



\---



\## License



ISC

