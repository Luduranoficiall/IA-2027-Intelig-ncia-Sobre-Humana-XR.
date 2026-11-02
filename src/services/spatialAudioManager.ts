import * as THREE from 'three';

export type TelemetryClusterId = 'openbrain' | 'tianwan' | 'global';

export interface SpatialAudioState {
  enabled: boolean;
  activeCluster: TelemetryClusterId;
  masterVolume: number;
  humVolume: number;
  chimeVolume: number;
  isUnlocked: boolean;
}

/**
 * Spatial Audio Manager for AI 2027: Superhuman Intelligence XR
 * Generates procedural, low-frequency 'data center' hums and 'neuralese' resonance chimes
 * that respond to the currently selected telemetry cluster with 3D spatial attenuation.
 */
export class SpatialAudioManager {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;
  private isMuted = false;
  private masterGain: GainNode | null = null;
  private activeCluster: TelemetryClusterId = 'openbrain';

  // Master volumes (ambient, unobtrusive mix)
  private masterVol = 0.22;
  private humVol = 0.18;
  private chimeVol = 0.15;

  // Spatial Panners
  private dataCenterPanner: PannerNode | null = null;
  private neuralesePanner: PannerNode | null = null;

  // Data Center Hum Nodes
  private humGain: GainNode | null = null;
  private oscBase: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private oscDetune: OscillatorNode | null = null;
  private hvacSource: AudioBufferSourceNode | null = null;
  private hvacFilter: BiquadFilterNode | null = null;
  private humFilter: BiquadFilterNode | null = null;

  // Neuralese Chimes Nodes & Interval
  private chimeGain: GainNode | null = null;
  private chimeTimer?: number;

  // Listeners
  private onStateChangeListeners: Array<(state: SpatialAudioState) => void> = [];

  // Temporary vectors for spatial tracking
  private tempCameraPos = new THREE.Vector3();
  private tempCameraDir = new THREE.Vector3();
  private tempCameraUp = new THREE.Vector3();

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  /**
   * Initializes or resumes the AudioContext on user interaction
   */
  public async unlock(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          console.warn('Web Audio API not supported in this browser.');
          return false;
        }
        this.ctx = new AudioCtx();
        this.setupAudioGraph();
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.isUnlocked = this.ctx.state === 'running';
      this.notifyState();
      return this.isUnlocked;
    } catch (err) {
      console.warn('AudioContext unlock failed:', err);
      return false;
    }
  }

  private setupAudioGraph(): void {
    if (!this.ctx) return;

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. Setup Data Center 3D Panner (emanating from below floor / server racks: Y = 0.3m, Z = -1.5m)
    this.dataCenterPanner = this.ctx.createPanner();
    this.dataCenterPanner.panningModel = 'HRTF';
    this.dataCenterPanner.distanceModel = 'inverse';
    this.dataCenterPanner.refDistance = 1.0;
    this.dataCenterPanner.maxDistance = 15.0;
    this.dataCenterPanner.rolloffFactor = 0.8;
    this.dataCenterPanner.coneInnerAngle = 360;
    this.dataCenterPanner.positionX.setValueAtTime(0, this.ctx.currentTime);
    this.dataCenterPanner.positionY.setValueAtTime(0.3, this.ctx.currentTime);
    this.dataCenterPanner.positionZ.setValueAtTime(-1.5, this.ctx.currentTime);
    this.dataCenterPanner.connect(this.masterGain);

    // 2. Setup Neuralese 3D Panner (emanating from the floating central 3D stage: Y = 1.35m, Z = -1.5m)
    this.neuralesePanner = this.ctx.createPanner();
    this.neuralesePanner.panningModel = 'HRTF';
    this.neuralesePanner.distanceModel = 'inverse';
    this.neuralesePanner.refDistance = 0.8;
    this.neuralesePanner.maxDistance = 12.0;
    this.neuralesePanner.rolloffFactor = 0.9;
    this.neuralesePanner.positionX.setValueAtTime(0, this.ctx.currentTime);
    this.neuralesePanner.positionY.setValueAtTime(1.35, this.ctx.currentTime);
    this.neuralesePanner.positionZ.setValueAtTime(-1.5, this.ctx.currentTime);
    this.neuralesePanner.connect(this.masterGain);

    // 3. Data Center Hum Synthesis
    this.humGain = this.ctx.createGain();
    this.humGain.gain.setValueAtTime(this.humVol, this.ctx.currentTime);
    this.humGain.connect(this.dataCenterPanner);

    // Lowpass filter for warm electrical hum
    this.humFilter = this.ctx.createBiquadFilter();
    this.humFilter.type = 'lowpass';
    this.humFilter.frequency.setValueAtTime(170, this.ctx.currentTime);
    this.humFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);
    this.humFilter.connect(this.humGain);

    // Primary transformer hum (58 Hz base for OpenBrain)
    this.oscBase = this.ctx.createOscillator();
    this.oscBase.type = 'sine';
    this.oscBase.frequency.setValueAtTime(58, this.ctx.currentTime);

    // Secondary detuned oscillator for realistic acoustic pulsation
    this.oscDetune = this.ctx.createOscillator();
    this.oscDetune.type = 'triangle';
    this.oscDetune.frequency.setValueAtTime(59.1, this.ctx.currentTime);

    // Deep sub-harmonic (29 Hz)
    this.oscSub = this.ctx.createOscillator();
    this.oscSub.type = 'sine';
    this.oscSub.frequency.setValueAtTime(29, this.ctx.currentTime);

    const baseGain = this.ctx.createGain();
    baseGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.oscBase.connect(baseGain);
    baseGain.connect(this.humFilter);

    const detuneGain = this.ctx.createGain();
    detuneGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    this.oscDetune.connect(detuneGain);
    detuneGain.connect(this.humFilter);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.oscSub.connect(subGain);
    subGain.connect(this.humFilter);

    this.oscBase.start();
    this.oscDetune.start();
    this.oscSub.start();

    // Subtle HVAC / Cryogenic Airflow (Looping pink-noise buffer)
    this.startHvacNoise();

    // 4. Neuralese Chimes Synthesis
    this.chimeGain = this.ctx.createGain();
    this.chimeGain.gain.setValueAtTime(this.chimeVol, this.ctx.currentTime);
    this.chimeGain.connect(this.neuralesePanner);

    this.startChimeScheduler();
  }

  /**
   * Generates a 2-second looping filtered noise buffer simulating datacenter air cooling
   */
  private startHvacNoise(): void {
    if (!this.ctx || !this.humGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.08;
    }

    this.hvacSource = this.ctx.createBufferSource();
    this.hvacSource.buffer = noiseBuffer;
    this.hvacSource.loop = true;

    this.hvacFilter = this.ctx.createBiquadFilter();
    this.hvacFilter.type = 'bandpass';
    this.hvacFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.hvacFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const hvacGain = this.ctx.createGain();
    hvacGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.hvacSource.connect(this.hvacFilter);
    this.hvacFilter.connect(hvacGain);
    hvacGain.connect(this.humGain);

    this.hvacSource.start();
  }

  /**
   * Triggers algorithmic chime bursts at intervals simulating neuralese thought vectors
   */
  private startChimeScheduler(): void {
    const scheduleNext = () => {
      // Delay between 3.5s and 6.0s
      const delayMs = 3500 + Math.random() * 2500;
      this.chimeTimer = window.setTimeout(() => {
        if (this.isUnlocked && !this.isMuted) {
          this.playNeuraleseChime();
        }
        scheduleNext();
      }, delayMs);
    };
    scheduleNext();
  }

  /**
   * Plays an expressive, crystalline harmonic chime responding to the current cluster profile
   */
  public playNeuraleseChime(customNoteFreq?: number): void {
    if (!this.ctx || !this.chimeGain || !this.isUnlocked) return;

    const now = this.ctx.currentTime;

    // Cluster-specific harmonic frequency scales
    const notePools: Record<TelemetryClusterId, number[]> = {
      openbrain: [880, 1046.5, 1318.5, 1567.98, 1760, 2093], // Ethereal crystalline high frequencies (50x speed)
      tianwan: [440, 523.25, 659.25, 783.99, 880, 987.77],   // Industrial, heavy harmonic resonant bells
      global: [587.33, 698.46, 880, 1046.5, 1174.66, 1396.9], // Distributed planetary grid harmonics
    };

    const notes = notePools[this.activeCluster];
    const freq = customNoteFreq || notes[Math.floor(Math.random() * notes.length)];

    // Carrier oscillator (sine bell)
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(freq, now);

    // Modulator oscillator for FM bell resonance
    const modulator = this.ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(freq * 1.5, now);

    const modIndex = this.ctx.createGain();
    modIndex.gain.setValueAtTime(freq * 0.4, now);
    modIndex.gain.exponentialRampToValueAtTime(0.01, now + 1.8);

    modulator.connect(modIndex);
    modIndex.connect(carrier.frequency);

    // Envelope gain
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    // Instant attack, smooth exponential decay
    env.gain.linearRampToValueAtTime(0.12, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    carrier.connect(env);
    env.connect(this.chimeGain);

    carrier.start(now);
    modulator.start(now);

    carrier.stop(now + 2.4);
    modulator.stop(now + 2.4);
  }

  /**
   * Responds dynamically to cluster changes by ramping frequencies and acoustics
   */
  public setCluster(cluster: TelemetryClusterId): void {
    this.activeCluster = cluster;
    if (!this.ctx) {
      this.notifyState();
      return;
    }

    const now = this.ctx.currentTime;
    const rampTime = 1.2; // Smooth 1.2s acoustic transition

    if (this.oscBase && this.oscDetune && this.oscSub && this.humFilter && this.hvacFilter) {
      if (cluster === 'tianwan') {
        // China 50Hz grid standard: deeper, nuclear turbine rumble
        this.oscBase.frequency.exponentialRampToValueAtTime(50.0, now + rampTime);
        this.oscDetune.frequency.exponentialRampToValueAtTime(51.1, now + rampTime);
        this.oscSub.frequency.exponentialRampToValueAtTime(25.0, now + rampTime);
        this.humFilter.frequency.exponentialRampToValueAtTime(140.0, now + rampTime);
        this.hvacFilter.frequency.exponentialRampToValueAtTime(110.0, now + rampTime);
      } else if (cluster === 'global') {
        // Aggregate Global Grid: 55Hz composite, wider band airflow
        this.oscBase.frequency.exponentialRampToValueAtTime(55.0, now + rampTime);
        this.oscDetune.frequency.exponentialRampToValueAtTime(56.4, now + rampTime);
        this.oscSub.frequency.exponentialRampToValueAtTime(27.5, now + rampTime);
        this.humFilter.frequency.exponentialRampToValueAtTime(210.0, now + rampTime);
        this.hvacFilter.frequency.exponentialRampToValueAtTime(170.0, now + rampTime);
      } else {
        // OpenBrain US: 58Hz crisp cryo-cooled hum
        this.oscBase.frequency.exponentialRampToValueAtTime(58.0, now + rampTime);
        this.oscDetune.frequency.exponentialRampToValueAtTime(59.1, now + rampTime);
        this.oscSub.frequency.exponentialRampToValueAtTime(29.0, now + rampTime);
        this.humFilter.frequency.exponentialRampToValueAtTime(170.0, now + rampTime);
        this.hvacFilter.frequency.exponentialRampToValueAtTime(140.0, now + rampTime);
      }
    }

    // Play a distinct cluster transition chime
    this.playNeuraleseChime();
    this.notifyState();
  }

  /**
   * Updates Web Audio listener position and orientation from Three.js camera each frame
   */
  public updateListener(camera: THREE.Camera): void {
    if (!this.ctx || !this.isUnlocked) return;

    camera.getWorldPosition(this.tempCameraPos);
    camera.getWorldDirection(this.tempCameraDir);
    this.tempCameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion);

    const listener = this.ctx.listener;
    const now = this.ctx.currentTime;

    if (listener.positionX) {
      listener.positionX.setValueAtTime(this.tempCameraPos.x, now);
      listener.positionY.setValueAtTime(this.tempCameraPos.y, now);
      listener.positionZ.setValueAtTime(this.tempCameraPos.z, now);
      listener.forwardX.setValueAtTime(this.tempCameraDir.x, now);
      listener.forwardY.setValueAtTime(this.tempCameraDir.y, now);
      listener.forwardZ.setValueAtTime(this.tempCameraDir.z, now);
      listener.upX.setValueAtTime(this.tempCameraUp.x, now);
      listener.upY.setValueAtTime(this.tempCameraUp.y, now);
      listener.upZ.setValueAtTime(this.tempCameraUp.z, now);
    } else {
      // Fallback for older Web Audio implementations
      listener.setPosition(this.tempCameraPos.x, this.tempCameraPos.y, this.tempCameraPos.z);
      listener.setOrientation(
        this.tempCameraDir.x,
        this.tempCameraDir.y,
        this.tempCameraDir.z,
        this.tempCameraUp.x,
        this.tempCameraUp.y,
        this.tempCameraUp.z
      );
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.masterVol, now + 0.15);
    }
    this.notifyState();
    return this.isMuted;
  }

  public setMasterVolume(vol: number): void {
    this.masterVol = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
    }
    this.notifyState();
  }

  public getState(): SpatialAudioState {
    return {
      enabled: !this.isMuted && this.isUnlocked,
      activeCluster: this.activeCluster,
      masterVolume: this.masterVol,
      humVolume: this.humVol,
      chimeVolume: this.chimeVol,
      isUnlocked: this.isUnlocked,
    };
  }

  public subscribe(cb: (state: SpatialAudioState) => void): () => void {
    this.onStateChangeListeners.push(cb);
    cb(this.getState());
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== cb);
    };
  }

  private notifyState(): void {
    const state = this.getState();
    this.onStateChangeListeners.forEach((l) => l(state));
  }

  public dispose(): void {
    if (this.chimeTimer) {
      clearTimeout(this.chimeTimer);
      this.chimeTimer = undefined;
    }
    if (this.oscBase) {
      try { this.oscBase.stop(); } catch {}
    }
    if (this.oscDetune) {
      try { this.oscDetune.stop(); } catch {}
    }
    if (this.oscSub) {
      try { this.oscSub.stop(); } catch {}
    }
    if (this.hvacSource) {
      try { this.hvacSource.stop(); } catch {}
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

// Export singleton instance for global scene coordination
export const spatialAudioManager = new SpatialAudioManager();
