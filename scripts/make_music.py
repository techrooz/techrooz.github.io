"""Generate an original, royalty-free background beat + transition SFX for reels.

Usage: python3 scripts/make_music.py <seconds> <bpm> <out.wav> [whoosh.wav] [hit.wav]
Pure synthesis (numpy): punchy kick, snare, hats, sub bass and a minor pad. No copyrighted audio.
"""
import sys, wave
import numpy as np

SR = 44100


def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / r)


def kick(n=int(SR * .35)):
    t = np.arange(n) / SR
    f = 50 + 120 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .12)


def snare(n=int(SR * .25)):
    return (np.random.randn(n) * .6 + np.sin(2 * np.pi * 190 * np.arange(n) / SR) * .4) * env(n, .001, .07)


def hat(n=int(SR * .06)):
    x = np.random.randn(n)
    return np.diff(np.concatenate([[0], x])) * env(n, .0005, .015) * .35


def tone(f, n, kind="saw"):
    t = np.arange(n) / SR
    if kind == "sine":
        return np.sin(2 * np.pi * f * t)
    return 2 * ((f * t) % 1) - 1


def lowpass(x, a=.08):
    y = np.zeros_like(x); acc = 0.0
    a = np.broadcast_to(np.asarray(a, dtype=float), x.shape)
    for i, v in enumerate(x):
        acc += a[i] * (v - acc); y[i] = acc
    return y


def beat(seconds, bpm):
    n = int(SR * seconds); out = np.zeros(n + SR)
    step = 60 / bpm / 4  # 16th notes
    prog = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]  # Am F C G
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    bar = int(SR * step * 16)
    pad_cache = {}
    for b in range(int(seconds / (step * 16)) + 1):
        if b * bar >= len(out):
            break
        ch = prog[b % 4]; s0 = b * bar
        if ch not in pad_cache:
            p = sum(tone(hz(m), bar, "saw") for m in ch) / 3
            pad_cache[ch] = lowpass(p, .03) * .18 * np.minimum(np.arange(bar) / (SR * .3), 1)
        m = min(bar, len(out) - s0)
        out[s0:s0 + m] += pad_cache[ch][:m]
        pulse = np.resize(env(bar // 8, .005, .18), bar)
        bass = tone(hz(ch[0] - 24), bar, "sine") * .35 * pulse
        m = min(bar, len(out) - s0)
        out[s0:s0 + m] += bass[:m]
        for i in range(16):
            p = s0 + int(i * step * SR)
            for cond, snd in ((i in (0, 6, 10), kick()), (i in (4, 12), snare()), (True, hat())):
                if cond and p < len(out):
                    seg = snd[:len(out) - p]; out[p:p + len(seg)] += seg
    out = out[:n]
    fade = int(SR * 1.2)
    out[:fade] *= np.linspace(0, 1, fade); out[-fade:] *= np.linspace(1, 0, fade)
    return out / (np.abs(out).max() + 1e-9) * .8


def whoosh(sec=.45):
    n = int(SR * sec); t = np.linspace(0, 1, n)
    x = lowpass(np.random.randn(n), .05 + .4 * t) * np.sin(np.pi * t) ** 2
    return x / np.abs(x).max() * .7


def hit(sec=.6):
    x = kick(int(SR * sec)) + snare(int(SR * sec)) * .5
    return x / np.abs(x).max() * .9


def save(x, path):
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    save(beat(float(sys.argv[1]), float(sys.argv[2])), sys.argv[3])
    if len(sys.argv) > 4:
        save(whoosh(), sys.argv[4])
    if len(sys.argv) > 5:
        save(hit(), sys.argv[5])
