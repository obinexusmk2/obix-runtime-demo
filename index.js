import { ObixRuntime } from '@obinexusltd/obix';

// Initialize the OBIX runtime (includes DOM driver, input, state machine, etc.)
const runtime = new ObixRuntime({
  // Polygaltic telemetry hook (powered by LibPolyCall protocol)
  onTelemetry: (event) => {
    console.log('%c[PolyCall Telemetry]', 'color:#0ff;font-weight:bold', event);
    // In a real app this would talk to libpolycall-v1 daemon for cross-language state sync
  }
});

// Register polygaltic components (data-first, no JSX)
runtime.register({
  name: 'Counter',
  state: { count: 42, lang: 'TypeScript' },
  actions: {
    increment: (state) => ({ count: state.count + 1 }),
    reset: () => ({ count: 0 }),
    switchLang: (state) => ({ lang: state.lang === 'TypeScript' ? 'Rust' : 'TypeScript' })
  },
  render: (state, actions) => `
    <div style="border:2px solid #0f0;padding:2rem;border-radius:12px">
      <h1>OBIX Polygaltic Demo</h1>
      <h2>Count: <span id="count">${state.count}</span></h2>
      <button onclick="runtime.getInstance('Counter-1').actions.increment()">+1</button>
      <button onclick="runtime.getInstance('Counter-1').actions.reset()">Reset</button>
      <button onclick="runtime.getInstance('Counter-1').actions.switchLang()">
        Switch to ${state.lang === 'TypeScript' ? 'Rust' : 'TypeScript'}
      </button>
      <p>Current language binding: <strong>${state.lang}</strong> (via LibPolyCall polymorphic protocol)</p>
      <hr>
      <small>Powered by @obinexusltd/obix + github.com/obinexusmk2/libpolycall-v1</small>
    </div>
  `
});

// Create instance + mount
const counter = runtime.create('Counter', { target: '#app' });

// Live state sync (LibPolyCall-style)
setInterval(() => {
  runtime.update(counter.id, 'increment');
}, 3000);

// You can now import any other module you saw in the screenshots:
// import '@obinexusltd/obix-sdk-router';
// import '@obinexusltd/obix-sdk-forms';
// import '@obinexusltd/obix-driver-media-query';
// etc. — they are all already available.