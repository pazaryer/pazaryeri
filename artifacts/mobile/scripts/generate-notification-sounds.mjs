/**
 * Pazaryeri özel bildirim sesleri — kısa, markaya uygun tonlar.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'assets', 'sounds');

function writeWav(filePath, notes, durationMs, sampleRate = 44100) {
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    for (const note of notes) {
      if (t < note.start || t > note.end) continue;
      const local = t - note.start;
      const dur = note.end - note.start;
      const attack = Math.min(1, local / 0.012);
      const release = Math.min(1, (dur - local) / 0.08);
      const env = attack * release;
      sample += Math.sin(2 * Math.PI * note.freq * t) * note.amp * env;
      if (note.harmonic) {
        sample += Math.sin(2 * Math.PI * note.freq * note.harmonic * t) * note.amp * 0.25 * env;
      }
    }
    const clipped = Math.max(-1, Math.min(1, sample));
    buf.writeInt16LE(Math.floor(clipped * 32767 * 0.85), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buf);
}

fs.mkdirSync(outDir, { recursive: true });

// Uygulama içi popup — yumuşak çift nota
writeWav(path.join(outDir, 'pazaryeri_inapp.wav'), [
  { freq: 880, amp: 0.55, start: 0, end: 0.14, harmonic: 2 },
  { freq: 1174.66, amp: 0.45, start: 0.1, end: 0.32, harmonic: 2 },
], 340);

// Push bildirimi — daha belirgin, sıcak üçlü akor hissi
writeWav(path.join(outDir, 'pazaryeri_push.wav'), [
  { freq: 523.25, amp: 0.5, start: 0, end: 0.18, harmonic: 2 },
  { freq: 659.25, amp: 0.42, start: 0.08, end: 0.28, harmonic: 2 },
  { freq: 783.99, amp: 0.35, start: 0.16, end: 0.45, harmonic: 2 },
], 480);

// Mesaj push — hafif farklı (yüksek tını)
writeWav(path.join(outDir, 'pazaryeri_message.wav'), [
  { freq: 698.46, amp: 0.48, start: 0, end: 0.2, harmonic: 2 },
  { freq: 932.33, amp: 0.4, start: 0.12, end: 0.38, harmonic: 2 },
], 400);

// Favori / ilan güncelleme push
writeWav(path.join(outDir, 'pazaryeri_favorite.wav'), [
  { freq: 440, amp: 0.45, start: 0, end: 0.16, harmonic: 3 },
  { freq: 554.37, amp: 0.5, start: 0.1, end: 0.35, harmonic: 2 },
], 380);

console.log('Wrote notification sounds to', outDir);
