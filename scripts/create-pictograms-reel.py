#!/usr/bin/env python3
"""Export pictograms.html using its own physics. Requires Pillow, Node and FFmpeg."""
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'exports'
FPS, SECONDS = 30, 30
WIDTH, HEIGHT = 1080, 1920

# Run the original page script with a minimal DOM and a deterministic clock.
# A 540x960 logical viewport preserves the mobile layout at 2x resolution.
SIMULATION = r"""
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync('pictograms.html', 'utf8');
let source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
source = source.replace('resize(); syncPlayback();\n  })();',
  'resize(); globalThis.exportAnimation = {discs, tick};\n  })();');
let seed = 20260904;
const math = Object.create(Math);
math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const sandbox = {
  Math: math, innerWidth: 540, innerHeight: 960,
  Image: class { constructor() { this.style = {}; } addEventListener() {} },
  document: {hidden: false, querySelector: () => ({appendChild() {}}), addEventListener() {}},
  matchMedia: () => ({matches: false, addEventListener() {}}),
  requestAnimationFrame: () => 1, cancelAnimationFrame() {}, addEventListener() {}
};
vm.createContext(sandbox); vm.runInContext(source, sandbox);
const {discs, tick} = sandbox.exportAnimation;
const frames = [];
for (let i = 0; i < 900; i++) {
  tick(1000 + i * 1000 / 30);
  frames.push(discs.map(d => [d.x, d.y, d.angle]));
}
process.stdout.write(JSON.stringify({
  images: discs.map(d => ({src: decodeURIComponent(d.image.src), radius: d.radius})), frames
}));
"""


def main():
    OUT.mkdir(exist_ok=True)
    simulation = json.loads(subprocess.check_output(['node', '-e', SIMULATION], cwd=ROOT))
    sprites = []
    for info in simulation['images']:
        size = round(info['radius'] * 4)
        sprite = Image.open(ROOT / info['src']).convert('RGBA').resize((size, size), Image.Resampling.LANCZOS)
        # Match the page's CSS circle(47.4%), with an antialiased edge.
        mask = Image.new('L', (size * 4, size * 4))
        inset = size * 4 * .026
        ImageDraw.Draw(mask).ellipse((inset, inset, size * 4 - inset, size * 4 - inset), fill=255)
        sprite.putalpha(mask.resize((size, size), Image.Resampling.LANCZOS))
        sprites.append(sprite)
    output = OUT / 'vidiotbox-pictograms-instagram-reel.mp4'
    command = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
               '-s', f'{WIDTH}x{HEIGHT}', '-r', str(FPS), '-i', '-', '-an',
               '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
               '-profile:v', 'high', '-level:v', '4.1', '-pix_fmt', 'yuv420p',
               '-movflags', '+faststart', str(output)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for index, positions in enumerate(simulation['frames']):
            frame = Image.new('RGB', (WIDTH, HEIGHT), 'black')
            for sprite, (x, y, angle) in zip(sprites, positions):
                rotated = sprite.rotate(-angle, Image.Resampling.BICUBIC, expand=True)
                frame.paste(rotated, (round(x * 2 - rotated.width / 2), round(y * 2 - rotated.height / 2)), rotated)
            if index in (0, 300, 600, 899):
                frame.save(OUT / f'pictograms-preview-{index:03}.jpg', quality=93)
            process.stdin.write(frame.tobytes())
            if index % (FPS * 5) == 0:
                print(f'Rendered {index // FPS}/{SECONDS} seconds', flush=True)
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError('Video encoding failed')
    print(output, flush=True)


if __name__ == '__main__':
    main()
