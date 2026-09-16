/**
 * Anti-Cheating & Security Lockdown Utilities for CBT 2026
 * Enforces Fullscreen, Detects Minimize/Tab-Switch, Blocks Split Screen, and Hardens Exam Session.
 */

export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isMacTouch = /Macintosh/i.test(userAgent) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1;
  return isIOS || isMacTouch;
};

export const isIOSStandalone = (): boolean => {
  if (!isIOSDevice()) return false;
  const nav = window.navigator as any;
  const isStandaloneNav = Boolean(nav && nav.standalone);
  const isStandaloneMedia = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
  return isStandaloneNav || isStandaloneMedia;
};

export const requestAppFullscreen = async (): Promise<boolean> => {
  try {
    const docEl = document.documentElement as any;
    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen();
      return true;
    } else if (docEl.webkitRequestFullscreen) {
      await docEl.webkitRequestFullscreen();
      return true;
    } else if (docEl.mozRequestFullScreen) {
      await docEl.mozRequestFullScreen();
      return true;
    } else if (docEl.msRequestFullscreen) {
      await docEl.msRequestFullscreen();
      return true;
    }
  } catch (err) {
    console.warn('Fullscreen request fell through:', err);
  }

  // Graceful fallback for iOS iPhone Safari where Element.requestFullscreen is blocked by Apple
  if (isIOSDevice()) {
    return true;
  }

  return false;
};

export const exitAppFullscreen = async (): Promise<void> => {
  try {
    const doc = document as any;
    if (doc.exitFullscreen && isAppFullscreen()) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen && isAppFullscreen()) {
      await doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen && isAppFullscreen()) {
      await doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen && isAppFullscreen()) {
      await doc.msExitFullscreen();
    }
  } catch (err) {
    console.warn('Exit fullscreen fell through:', err);
  }
};

export const isAppFullscreen = (): boolean => {
  const doc = document as any;
  const standardFull = Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );

  if (standardFull) return true;

  // Adaptive Fullscreen Detection for iPhone / iOS
  if (isIOSDevice()) {
    if (isIOSStandalone()) return true;
    // On iOS Safari browser where HTML5 Fullscreen API is blocked on document root,
    // check if viewport is active and occupying full screen area
    const winH = window.innerHeight;
    const screenH = typeof window.screen !== 'undefined' ? (window.screen.height || window.screen.availHeight) : 0;
    if (screenH > 0 && winH >= screenH - 140) {
      return true;
    }
    return true; // Fallback to avoid false positive anti-cheat block on iPhone
  }

  return false;
};

export interface SplitScreenCheckResult {
  isSplit: boolean;
  reason: string;
  widthRatio: number;
  heightRatio: number;
}

export const checkSplitScreenViolation = (): SplitScreenCheckResult => {
  try {
    const screenW = window.screen.availWidth || window.screen.width || window.innerWidth;
    const screenH = window.screen.availHeight || window.screen.height || window.innerHeight;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const widthRatio = winW / screenW;
    const heightRatio = winH / screenH;

    // Detect horizontal split (e.g., student opened browser side-by-side)
    if (widthRatio < 0.78 && screenW > 500) {
      return {
        isSplit: true,
        reason: `Layar terbagi horizontal / samping (Lebar jendela ${winW}px dari layar ${screenW}px / ${Math.round(widthRatio * 100)}%)`,
        widthRatio,
        heightRatio,
      };
    }

    // Detect vertical split (e.g., student opened bottom split on mobile/tablet)
    if (heightRatio < 0.65 && screenH > 500) {
      return {
        isSplit: true,
        reason: `Layar terbagi vertikal / atas-bawah (Tinggi jendela ${winH}px dari layar ${screenH}px / ${Math.round(heightRatio * 100)}%)`,
        widthRatio,
        heightRatio,
      };
    }

    return {
      isSplit: false,
      reason: '',
      widthRatio,
      heightRatio,
    };
  } catch (e) {
    return { isSplit: false, reason: '', widthRatio: 1, heightRatio: 1 };
  }
};

export const clearClipboard = () => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText('').catch(() => {});
    }
  } catch (e) {}
};

export const playWarningAlarm = (customAudioUrl?: string, enableAudio: boolean = true) => {
  if (!enableAudio) return;

  try {
    // 1. Play MP3 Warning Alarm
    const mp3Url = customAudioUrl || '/warning-alarm.mp3';
    const audio = new Audio(mp3Url);
    audio.volume = 1.0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }

    // 2. High-priority Synthesizer Siren Wave
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;

      const playSirenPulse = (f1: number, f2: number, start: number, dur: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f1, start);
        osc.frequency.exponentialRampToValueAtTime(f2, start + dur * 0.8);
        gain.gain.setValueAtTime(0.65, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };

      playSirenPulse(900, 450, now, 0.25);
      playSirenPulse(1000, 500, now + 0.25, 0.25);
      playSirenPulse(900, 400, now + 0.50, 0.35);
    }

    // 3. Web Speech API Voice Warning
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        'Peringatan! Pelanggaran kecurangan ujian terdeteksi! Dilarang berpindah layar, mengecilkan jendela, atau membuka aplikasi lain!'
      );
      utterance.lang = 'id-ID';
      utterance.rate = 1.1;
      utterance.pitch = 1.2;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.warn('Audio warning failed or blocked by browser', e);
  }
};
