/**
 * WebXR Haptics Feedback Service
 * Provides tactile confirmation pulses for controllers (Galaxy XR, Meta Quest, HTC Vive, Pico)
 * when interacting with telemetry dashboards, switching AI clusters, and managing critical alerts.
 */

export type HapticPreset =
  | 'cluster-switch'
  | 'metric-focus'
  | 'anomaly-alert'
  | 'button-click'
  | 'dossier-export'
  | 'light-tick';

export interface HapticPatternStep {
  intensity: number; // 0.0 to 1.0
  durationMs: number;
  pauseMs?: number;
}

class HapticsService {
  private enabled = true;
  private isProcessing = false;

  /**
   * Triggers a specialized haptic feedback preset.
   */
  async trigger(preset: HapticPreset, handedness?: 'left' | 'right' | 'all') {
    if (!this.enabled) return;

    switch (preset) {
      case 'cluster-switch':
        // Strong, high-priority dual-pulse confirming major cluster reconfiguration
        await this.playPattern([
          { intensity: 0.85, durationMs: 45, pauseMs: 35 },
          { intensity: 1.0, durationMs: 75 },
        ], handedness);
        break;

      case 'metric-focus':
        // Crisp, refined tactile click for metric navigation
        await this.pulse(0.45, 25, handedness);
        break;

      case 'anomaly-alert':
        // Triple urgent stutter pulse warning of thermal/containment anomaly
        await this.playPattern([
          { intensity: 0.9, durationMs: 50, pauseMs: 30 },
          { intensity: 0.95, durationMs: 50, pauseMs: 30 },
          { intensity: 1.0, durationMs: 90 },
        ], handedness);
        break;

      case 'dossier-export':
        // Ascending confirmation signature for formal crisis dossier issuance
        await this.playPattern([
          { intensity: 0.35, durationMs: 30, pauseMs: 25 },
          { intensity: 0.65, durationMs: 40, pauseMs: 25 },
          { intensity: 0.95, durationMs: 70 },
        ], handedness);
        break;

      case 'button-click':
        // Standard snappy spatial UI feedback
        await this.pulse(0.55, 30, handedness);
        break;

      case 'light-tick':
      default:
        await this.pulse(0.3, 15, handedness);
        break;
    }
  }

  /**
   * Helper shortcut: cluster switch haptic pulse.
   */
  pulseClusterSwitch(handedness?: 'left' | 'right' | 'all') {
    return this.trigger('cluster-switch', handedness);
  }

  /**
   * Helper shortcut: metric focus / chart toggle haptic pulse.
   */
  pulseMetricFocus(handedness?: 'left' | 'right' | 'all') {
    return this.trigger('metric-focus', handedness);
  }

  /**
   * Helper shortcut: anomaly alert haptic pulse.
   */
  pulseAnomalyAlert(handedness?: 'left' | 'right' | 'all') {
    return this.trigger('anomaly-alert', handedness);
  }

  /**
   * Helper shortcut: dossier export haptic pulse.
   */
  pulseDossierExport(handedness?: 'left' | 'right' | 'all') {
    return this.trigger('dossier-export', handedness);
  }

  /**
   * Helper shortcut: general button click pulse.
   */
  pulseClick(handedness?: 'left' | 'right' | 'all') {
    return this.trigger('button-click', handedness);
  }

  /**
   * Low-level method to send a single pulse to active WebXR controllers or mobile devices.
   */
  async pulse(intensity: number, durationMs: number, handedness: 'left' | 'right' | 'all' = 'all'): Promise<boolean> {
    if (!this.enabled) return false;

    let actuated = false;
    const clampedIntensity = Math.max(0.05, Math.min(1.0, intensity));
    const clampedDuration = Math.max(10, Math.min(250, durationMs));

    // 1. Check WebXR Session input sources (W3C standard for WebXR headsets)
    try {
      const xrSession = (window as any).xb?.core?.renderer?.xr?.getSession?.() ||
        (navigator as any).xr?.session;

      if (xrSession?.inputSources) {
        for (const source of xrSession.inputSources) {
          if (handedness !== 'all' && source.handedness && source.handedness !== handedness) {
            continue;
          }

          const gamepad = source.gamepad;
          if (gamepad) {
            // Standard WebXR Gamepad Haptic Actuator (Quest, Galaxy XR, Pico, Vive)
            if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
              const actuator = gamepad.hapticActuators[0];
              if (typeof actuator.pulse === 'function') {
                actuator.pulse(clampedIntensity, clampedDuration);
                actuated = true;
              } else if (typeof actuator.playEffect === 'function') {
                actuator.playEffect('dual-rumble', {
                  startDelay: 0,
                  duration: clampedDuration,
                  weakMagnitude: clampedIntensity * 0.7,
                  strongMagnitude: clampedIntensity,
                });
                actuated = true;
              }
            } else if (gamepad.vibrationActuator && typeof gamepad.vibrationActuator.playEffect === 'function') {
              gamepad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: clampedDuration,
                weakMagnitude: clampedIntensity * 0.7,
                strongMagnitude: clampedIntensity,
              });
              actuated = true;
            }
          }
        }
      }
    } catch (err) {
      // Ignore XR session inspection errors silently
    }

    // 2. Check navigator.getGamepads() fallback (standard Gamepad API)
    if (!actuated && typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
      try {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
          const gp = gamepads[i];
          if (!gp) continue;

          if (gp.hapticActuators && gp.hapticActuators.length > 0) {
            const actuator = gp.hapticActuators[0];
            if (typeof actuator.pulse === 'function') {
              actuator.pulse(clampedIntensity, clampedDuration);
              actuated = true;
            }
          } else if (gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
            gp.vibrationActuator.playEffect('dual-rumble', {
              startDelay: 0,
              duration: clampedDuration,
              weakMagnitude: clampedIntensity * 0.7,
              strongMagnitude: clampedIntensity,
            });
            actuated = true;
          }
        }
      } catch (err) {
        // Ignore gamepad fallback errors
      }
    }

    // 3. Fallback to mobile device vibration if in 2D touch mode
    if (!actuated && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(clampedDuration);
        actuated = true;
      } catch {
        // Vibrator permission denied or not supported
      }
    }

    return actuated;
  }

  /**
   * Plays a sequential pattern of haptic pulses with delays.
   */
  async playPattern(steps: HapticPatternStep[], handedness: 'left' | 'right' | 'all' = 'all') {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      for (const step of steps) {
        await this.pulse(step.intensity, step.durationMs, handedness);
        if (step.pauseMs && step.pauseMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, step.pauseMs));
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Toggles haptic feedback on or off.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Returns current status of haptic feedback.
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

export const hapticsService = new HapticsService();
