export const INTRO_DURATION = 1.4;

export function sampleIntro(seconds, out) {
  out.coin = Math.max(0, Math.min(1, seconds / .44));
  out.shake = Math.max(0, Math.min(1, (seconds - .44) / .24));
  out.zoom = Math.max(0, Math.min(1, (seconds - .68) / (INTRO_DURATION - .68)));
  out.scan = Math.max(0, Math.min(1, (seconds - .82) / .48));
  out.phase = seconds < .44 ? 'coin' : seconds < .68 ? 'shake' : seconds < INTRO_DURATION ? 'zoom' : 'ready';
}
