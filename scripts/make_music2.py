#!/usr/bin/env python3
"""TechRooz background music v2: warm pad + soft pluck arpeggio + gentle bass/kick, 100 BPM, C-Am-F-G. No attribution needed (synthesized).
usage: make_music2.py out.wav [seconds=70]"""
import numpy as np, sys, wave
from scipy.signal import lfilter, butter, fftconvolve
SR=44100; dur=float(sys.argv[2]) if len(sys.argv)>2 else 70; N=int(SR*dur)
bpm=100; beat=60/bpm; bar=4*beat
rng=np.random.default_rng(7)
def mtof(m): return 440*2**((m-69)/12)
chords=[[48,52,55,59],[45,48,52,55],[41,45,48,52],[43,47,50,53]]  # Cmaj7 Am7 Fmaj7 G6
L=np.zeros(N); R=np.zeros(N)
def add(buf,x,t0,g=1.0):
    i=int(t0*SR); j=min(N,i+len(x))
    if i<N: buf[i:j]+=g*x[:j-i]
def env(n,a,d,s_lvl=0.0):
    t=np.arange(n)/SR; e=np.minimum(1,t/a)*np.exp(-t/d); return e
def pad(freqs,length):
    n=int(length*SR); t=np.arange(n)/SR; x=np.zeros(n)
    for f in freqs:
        for det in (-0.004,0,0.004):
            ff=f*(1+det); x+=np.sin(2*np.pi*ff*t)+0.35*np.sin(2*np.pi*2*ff*t)+0.12*np.sin(2*np.pi*3*ff*t)
    e=np.minimum(1,t/0.9)*np.minimum(1,(length-t)/0.9)
    return x*e/ (len(freqs)*3)
def pluck(f,length=0.9):
    n=int(length*SR); t=np.arange(n)/SR
    x=np.sin(2*np.pi*f*t)+0.4*np.sin(2*np.pi*2*f*t)*np.exp(-t*8)+0.15*np.sin(2*np.pi*3*f*t)*np.exp(-t*14)
    return x*np.exp(-t*4.2)*np.minimum(1,t/0.004)
def kick():
    n=int(0.35*SR); t=np.arange(n)/SR; f=55+70*np.exp(-t*30)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
def bass(f,length):
    n=int(length*SR); t=np.arange(n)/SR
    return (np.sin(2*np.pi*f*t)+0.2*np.sin(2*np.pi*2*f*t))*np.exp(-t*2.2)*np.minimum(1,t/0.01)
k=0; t0=0.0
while t0<dur:
    ch=chords[k%4]; k+=1
    p=pad([mtof(m+12) for m in ch[1:]],bar*2)  # 2 bars per chord
    add(L,p,t0,0.55); add(R,p,t0+0.012,0.55)
    for b in range(0,8,2):                   # quarter-note soft arpeggio, 2 bars
        note=ch[[1,2,3,2,1,3,2,3][b%8]]+12
        x=pluck(mtof(note)); tt=t0+b*beat/2*1.0
        add(L,x,tt,0.11); add(R,x,tt+0.006,0.11)
        tt2=t0+bar+b*beat/2; add(L,x,tt2,0.10); add(R,x,tt2+0.006,0.10)
    for bb in range(2):
        bs=bass(mtof(ch[0]-12),beat*3.8); add(L,bs,t0+bb*bar,0.5); add(R,bs,t0+bb*bar,0.5)
        for kb in (0,2):
            kk=kick(); add(L,kk,t0+bb*bar+kb*beat,0.45); add(R,kk,t0+bb*bar+kb*beat,0.45)
    t0+=bar*2
# soft reverb
imp=rng.standard_normal(int(SR*1.6))*np.exp(-np.arange(int(SR*1.6))/SR*3.2); imp/=np.abs(imp).sum()**0.5*8
def rev(x): return x+0.35*fftconvolve(x,imp)[:N]
L=rev(L); R=rev(R)
b,a=butter(2,5200/(SR/2)); L=lfilter(b,a,L); R=lfilter(b,a,R)
m=max(np.abs(L).max(),np.abs(R).max()); L/=m; R/=m
fade=np.minimum(1,np.arange(N)/(SR*1.5))*np.minimum(1,(N-np.arange(N))/(SR*2.5)); L*=fade*0.8; R*=fade*0.8
out=(np.stack([L,R],1)*32767).astype(np.int16)
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print("ok",dur)
