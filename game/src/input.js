// Orbital Drift — input: mouse + touch slingshot aiming, clicks, keys.
// The canvas is scaled by CSS; pointer positions are mapped back into
// the game's 1280x720 coordinate space here so the rest of the game
// never thinks about pixels.
export function toGameCoords(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((clientX - r.left) / r.width) * 1280,
    y: ((clientY - r.top) / r.height) * 720,
  };
}

export function attachInput(canvas, h) {
  let aiming = false;

  canvas.addEventListener('pointerdown', (e) => {
    const p = toGameCoords(canvas, e.clientX, e.clientY);
    aiming = true;
    h.onAimStart(p.x, p.y);
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!aiming) return;
    const p = toGameCoords(canvas, e.clientX, e.clientY);
    h.onAimMove(p.x, p.y);
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!aiming) return;
    aiming = false;
    const p = toGameCoords(canvas, e.clientX, e.clientY);
    h.onAimEnd(p.x, p.y);
  });
  canvas.addEventListener('pointercancel', () => { aiming = false; });
  canvas.addEventListener('click', (e) => {
    const p = toGameCoords(canvas, e.clientX, e.clientY);
    h.onClick(p.x, p.y);
  });
  window.addEventListener('keydown', (e) => {
    if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    h.onKey(e.key);
  });
}
