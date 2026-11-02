import * as THREE from 'three';
import * as xb from 'xrblocks';

import { BioVisualizer } from './scenes/BioVisualizer.ts';
import { NeuraleseVisualizer } from './scenes/NeuraleseVisualizer.ts';
import { GeopoliticalGlobe } from './scenes/GeopoliticalGlobe.ts';

import { TimelineCard } from './ui/TimelineCard.ts';
import { ChatbotCard } from './ui/ChatbotCard.ts';
import { BioscienceCard } from './ui/BioscienceCard.ts';
import { TelemetryPanel } from './ui/TelemetryPanel.ts';
import { TelemetryHistoryChart } from './ui/TelemetryHistoryChart.ts';
import { VisualizationMode, TimelineChapter } from './types.ts';
import { generateExecutiveDossierPDF, DossierGenerationResult } from './services/dossierPdfService.ts';
import { OnboardingModal } from './ui/OnboardingModal.ts';
import { spatialAudioManager } from './services/spatialAudioManager.ts';
import { dossierPreviewModal } from './ui/DossierPreviewModal.ts';
import { DossierSpatialCard } from './ui/DossierSpatialCard.ts';
import { hapticsService } from './services/hapticsService.ts';

/**
 * AI 2027: Superhuman Intelligence Observatory
 * An interactive WebXR simulation of the famous scenario by Daniel Kokotajlo et al.
 */
class AI2027Observatory extends xb.Script {
  stageGroup: THREE.Group = new THREE.Group();
  bioVis: BioVisualizer = new BioVisualizer();
  neuralVis: NeuraleseVisualizer = new NeuraleseVisualizer();
  globeVis: GeopoliticalGlobe = new GeopoliticalGlobe();

  timelineCard?: TimelineCard;
  chatbotCard?: ChatbotCard;
  bioscienceCard?: BioscienceCard;
  telemetryPanel?: TelemetryPanel;
  historyChart?: TelemetryHistoryChart;
  onboardingModal?: OnboardingModal;
  dossierSpatialCard?: DossierSpatialCard;
  lastDossierResult?: DossierGenerationResult;
  zenPillCard?: xb.UICard;
  zenPillBtn?: xb.UIButton;

  activeMode: VisualizationMode = 'neural';
  stageRotating = true;
  zenModeActive = false;

  init() {
    this.setupLighting();
    this.setup3DStage();
    this.setupSpatialCards();
    this.setVisualizationMode('neural');
  }

  setupLighting() {
    // Ambient / Hemisphere illumination
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x111827, 2.5);
    this.add(hemiLight);

    // Directional highlight lights framing the central 3D stage
    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.2);
    dirLight1.position.set(2.5, 4, 2);
    this.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.9);
    dirLight2.position.set(-2.5, 3, -1);
    this.add(dirLight2);

    // Subtle center floor glow ring beneath the 3D stage
    const ringGeo = new THREE.RingGeometry(0.38, 0.48, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.70, -1.50);
    this.add(ring);
  }

  setup3DStage() {
    this.stageGroup.name = 'Interactive 3D Stage';
    // Stage positioned with clear vertical and horizontal clearance
    this.stageGroup.position.set(0, 1.35, -1.50);

    // Make stage interactive for spatial manipulation
    this.stageGroup.xb = { manipulation: true };

    // Add visualizers to the stage group
    this.stageGroup.add(this.bioVis);
    this.stageGroup.add(this.neuralVis);
    this.stageGroup.add(this.globeVis);

    this.add(this.stageGroup);
  }

  setupSpatialCards() {
    // 1. Ala Esquerda: Timeline Navigator Card (afastado para a lateral esquerda em arco)
    this.timelineCard = new TimelineCard(
      (chapter: TimelineChapter) => {
        // Automatically switch 3D stage to recommended mode if chapter suggests
        if (chapter.recommended3DMode && chapter.recommended3DMode !== this.activeMode) {
          this.setVisualizationMode(chapter.recommended3DMode);
        }
      },
      (mode: VisualizationMode) => {
        this.setVisualizationMode(mode);
      }
    );
    this.timelineCard.name = 'Timeline Navigation Card';
    this.timelineCard.position.set(-1.18, 1.35, -1.25);
    this.timelineCard.rotation.y = 0.38; // 22° angulado para o usuário
    this.add(this.timelineCard);

    // 2. Ala Direita: Multi-turn Gemini Chatbot Card (afastado para a lateral direita em arco)
    this.chatbotCard = new ChatbotCard();
    this.chatbotCard.name = 'Gemini Intelligence Chatbot Card';
    this.chatbotCard.position.set(1.18, 1.35, -1.25);
    this.chatbotCard.rotation.y = -0.38; // -22° angulado para o usuário
    this.add(this.chatbotCard);

    // 3. Console Inferior: Bioscience Risk & Image Studio Card (como uma mesa de comando ergonômica rebaixada)
    this.bioscienceCard = new BioscienceCard((mode: VisualizationMode) => {
      this.setVisualizationMode(mode);
    });
    this.bioscienceCard.name = 'Bioscience & Image Studio Card';
    this.bioscienceCard.position.set(0, 0.44, -1.18);
    this.bioscienceCard.rotation.x = -0.36; // -21° inclinado para cima como console
    this.add(this.bioscienceCard);

    // 4. Dossel Superior: Real-Time Compute Telemetry Dashboard (elevado acima do palco)
    this.telemetryPanel = new TelemetryPanel(
      () => {
        if (this.historyChart) {
          this.historyChart.visible = !this.historyChart.visible;
          if (this.telemetryPanel) {
            this.telemetryPanel.chartBtn.label = this.historyChart.visible
              ? '✕ Fechar Gráfico'
              : 'Gráfico 60s';
          }
        }
      },
      (cluster) => {
        this.historyChart?.switchCluster(cluster);
      },
      () => {
        this.toggleZenMode();
      },
      (result) => {
        this.lastDossierResult = result;
        this.dossierSpatialCard?.show(result);
      }
    );
    this.telemetryPanel.name = 'Compute Telemetry Panel';
    this.telemetryPanel.position.set(0, 2.26, -1.35);
    this.telemetryPanel.rotation.x = 0.35; // 20° inclinado para baixo em direção aos olhos
    this.add(this.telemetryPanel);

    // 5. Cúpula Superior: Gráfico Histórico 60s Recharts (fica recolhido por padrão para visão 100% limpa)
    this.historyChart = new TelemetryHistoryChart();
    this.historyChart.name = 'Telemetry History Chart';
    this.historyChart.position.set(0, 2.84, -1.52);
    this.historyChart.rotation.x = 0.42;
    this.historyChart.visible = false;
    this.add(this.historyChart);

    // 6. Onboarding Walkthrough Spatial Modal (Diálogo Interativo de Instruções e Telemetria)
    this.onboardingModal = new OnboardingModal({
      onModeChange: (mode: VisualizationMode) => {
        this.setVisualizationMode(mode);
      },
      onZenToggle: () => {
        this.toggleZenMode();
      },
      onChartToggle: () => {
        if (this.historyChart) {
          this.historyChart.visible = !this.historyChart.visible;
          if (this.telemetryPanel) {
            this.telemetryPanel.chartBtn.label = this.historyChart.visible
              ? '✕ Fechar Gráfico'
              : 'Gráfico 60s';
          }
        }
      },
      onExportDossier: () => {
        const result = generateExecutiveDossierPDF({
          activeClusterId: this.telemetryPanel?.currentCluster || 'openbrain',
          liveTelemetry: this.telemetryPanel?.latestData,
        });
        this.lastDossierResult = result;
        this.dossierSpatialCard?.show(result);
        dossierPreviewModal.open(result);
      },
    });
    this.onboardingModal.name = 'Onboarding Walkthrough Modal';
    this.onboardingModal.visible = false;
    this.add(this.onboardingModal);

    // 7. Card Espacial Holográfico de Pré-Visualização do Dossiê em WebXR
    this.dossierSpatialCard = new DossierSpatialCard({
      onDownload: () => {
        if (this.lastDossierResult) {
          this.lastDossierResult.doc.save(this.lastDossierResult.filename);
          this.dossierSpatialCard?.hide();
        }
      },
      onOpen2DPreview: () => {
        if (this.lastDossierResult) {
          dossierPreviewModal.open(this.lastDossierResult);
        }
      },
      onClose: () => {
        this.dossierSpatialCard?.hide();
      },
    });
    this.dossierSpatialCard.name = 'Dossier Spatial Preview Card';
    this.dossierSpatialCard.position.set(0, 1.45, -1.05);
    this.add(this.dossierSpatialCard);

    // 8. Botão Flutuante Ergonômico de Foco no Palco 3D e Ações Rápidas
    this.setupZenPill();
  }

  setupZenPill() {
    const guideBtn = new xb.UIButton({
      icon: 'help_outline',
      label: 'Guia Interativo',
      style: {
        height: 36,
        fontSize: 12,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 18,
        backgroundColor: '#4f46e5dd',
        color: '#ffffff',
      },
      onClick: () => {
        hapticsService.pulseClick();
        this.openOnboarding();
      },
    });

    const zenBtn = new xb.UIButton({
      icon: 'visibility',
      label: 'Palco 3D Limpo (Ocultar Painéis)',
      style: {
        height: 36,
        fontSize: 12,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 18,
        backgroundColor: '#0284c7dd',
        color: '#ffffff',
      },
      onClick: () => {
        hapticsService.pulseClick();
        this.toggleZenMode();
      },
    });

    const exportBtn = new xb.UIButton({
      icon: 'description',
      label: 'Prévia do Dossiê (PDF)',
      style: {
        height: 36,
        fontSize: 12,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 18,
        backgroundColor: '#0369a1dd',
        color: '#ffffff',
      },
      onClick: () => {
        hapticsService.pulseDossierExport();
        const result = generateExecutiveDossierPDF({
          activeClusterId: this.telemetryPanel?.currentCluster || 'openbrain',
          liveTelemetry: this.telemetryPanel?.latestData,
        });
        this.lastDossierResult = result;
        this.dossierSpatialCard?.show(result);
        dossierPreviewModal.open(result);
      },
    });

    const audioBtn = new xb.UIButton({
      icon: 'volume_up',
      label: 'Áudio 3D',
      style: {
        height: 36,
        fontSize: 12,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 18,
        backgroundColor: '#7c3aeddd',
        color: '#ffffff',
      },
      onClick: async () => {
        hapticsService.pulseClick();
        await spatialAudioManager.unlock();
        const isMuted = spatialAudioManager.toggleMute();
        audioBtn.label = isMuted ? 'Mudo' : 'Áudio 3D';
        audioBtn.icon = isMuted ? 'volume_off' : 'volume_up';
      },
    });

    spatialAudioManager.subscribe((state) => {
      audioBtn.label = !state.enabled ? 'Mudo' : 'Áudio 3D';
      audioBtn.icon = !state.enabled ? 'volume_off' : 'volume_up';
    });

    const pillPanel = new xb.UIPanel({
      style: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
      },
      children: [guideBtn, zenBtn, audioBtn, exportBtn],
    });

    this.zenPillCard = new xb.UICard({
      size: { width: 1.16, height: 0.07 },
      manipulation: false,
      style: {
        padding: 2,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      },
      children: [pillPanel],
    });
    this.zenPillCard.position.set(0, 0.88, -1.22);
    this.zenPillCard.rotation.x = -0.22;
    this.zenPillBtn = zenBtn;
    this.add(this.zenPillCard);
  }

  openOnboarding() {
    if (this.onboardingModal) {
      this.onboardingModal.open();
    }
  }

  closeOnboarding() {
    if (this.onboardingModal) {
      this.onboardingModal.close();
    }
  }

  toggleZenMode() {
    this.zenModeActive = !this.zenModeActive;
    const showPanels = !this.zenModeActive;

    if (this.timelineCard) this.timelineCard.visible = showPanels;
    if (this.chatbotCard) this.chatbotCard.visible = showPanels;
    if (this.bioscienceCard) this.bioscienceCard.visible = showPanels;
    if (this.telemetryPanel) this.telemetryPanel.visible = showPanels;
    if (this.historyChart) this.historyChart.visible = false; // manter fechado ao restaurar

    if (this.zenPillBtn) {
      this.zenPillBtn.label = this.zenModeActive
        ? 'Restaurar Todos os Painéis'
        : 'Palco 3D Limpo (Ocultar Painéis)';
      this.zenPillBtn.style.backgroundColor = this.zenModeActive ? '#059669dd' : '#0284c7dd';
    }

    if (this.telemetryPanel?.zenBtn) {
      this.telemetryPanel.zenBtn.label = this.zenModeActive ? 'Restaurar' : 'Foco 3D';
    }

    // Sync 2D button if present
    const btn2D = document.getElementById('btnToggleZen2D');
    if (btn2D) {
      btn2D.textContent = this.zenModeActive ? 'Restaurar Painéis' : 'Palco 3D Limpo';
    }
  }

  setVisualizationMode(mode: VisualizationMode) {
    this.activeMode = mode;
    this.bioVis.visible = mode === 'bio';
    this.neuralVis.visible = mode === 'neural';
    this.globeVis.visible = mode === 'globe';
  }

  update() {
    const delta = xb.getDeltaTime();

    if (this.activeMode === 'bio' && this.bioVis.visible) {
      this.bioVis.update(delta);
    } else if (this.activeMode === 'neural' && this.neuralVis.visible) {
      this.neuralVis.update(delta);
    } else if (this.activeMode === 'globe' && this.globeVis.visible) {
      this.globeVis.update(delta);
    }

    // Update telemetry live beacon pulse
    this.telemetryPanel?.updateBeacon(delta);

    // Update 3D spatial audio listener orientation and position relative to user camera
    if (xb.core.camera) {
      spatialAudioManager.updateListener(xb.core.camera);
    }

    // Gentle floating bob of central stage
    if (this.stageGroup) {
      const time = performance.now() * 0.0015;
      this.stageGroup.position.y = 1.35 + Math.sin(time) * 0.02;
    }
  }

  onSelectStart() {
    spatialAudioManager.unlock();
    hapticsService.pulseMetricFocus();
    // Quick pinch in open space toggles between the 3 modes
    const modes: VisualizationMode[] = ['neural', 'bio', 'globe'];
    const nextIdx = (modes.indexOf(this.activeMode) + 1) % modes.length;
    this.setVisualizationMode(modes[nextIdx]);
  }

  dispose() {
    this.bioVis.dispose();
    this.neuralVis.dispose();
    this.globeVis.dispose();
    this.telemetryPanel?.dispose();
    this.historyChart?.dispose();
    this.zenPillCard?.dispose?.();
    this.onboardingModal?.dispose?.();
    this.dossierSpatialCard?.dispose?.();
    spatialAudioManager.dispose();
  }
}

// XR Options Configuration
const options = new xb.Options();
options.setAppTitle('AI 2027: Superhuman Intelligence XR');
options.setAppDescription(
  'Immersive WebXR exploration of the AI 2027 scenario with Gemini intelligence and 3D biosecurity models.'
);
options.enableReticles();
options.enableHands();
if (options.hands) {
  options.hands.visualization = true;
}
options.simulator.defaultMode = xb.SimulatorMode.CONTROLLER;

// Initialize XR Blocks and 2D DOM controls
document.addEventListener('DOMContentLoaded', () => {
  const observatory = new AI2027Observatory();
  xb.add(observatory);
  xb.init(options);

  // Wire 2D DOM Onboarding Guide Button
  const btnGuide2D = document.getElementById('btnOpenOnboarding2D');
  if (btnGuide2D) {
    btnGuide2D.addEventListener('click', () => {
      observatory.openOnboarding();
    });
  }

  // Auto-launch onboarding walkthrough for first-time users
  try {
    const hasSeenOnboarding = localStorage.getItem('ai2027_onboarding_shown');
    if (!hasSeenOnboarding) {
      setTimeout(() => {
        observatory.openOnboarding();
      }, 700);
    }
  } catch (err) {
    console.warn('LocalStorage check skipped:', err);
  }

  // Wire 2D DOM Spatial Audio Toggle Button
  const btnAudio2D = document.getElementById('btnToggleAudio2D');
  const audioLabel2D = document.getElementById('audioLabel2D');

  if (btnAudio2D) {
    btnAudio2D.addEventListener('click', async () => {
      await spatialAudioManager.unlock();
      const isMuted = spatialAudioManager.toggleMute();
      updateAudio2DUI(!isMuted);
    });
  }

  function updateAudio2DUI(enabled: boolean) {
    if (audioLabel2D) {
      audioLabel2D.textContent = enabled ? 'Áudio 3D: ON' : 'Áudio 3D: MUDO';
    }
    if (btnAudio2D) {
      if (enabled) {
        btnAudio2D.classList.remove('muted');
      } else {
        btnAudio2D.classList.add('muted');
      }
    }
  }

  spatialAudioManager.subscribe((state) => {
    updateAudio2DUI(state.enabled);
  });

  // Auto-unlock Web Audio on first user interaction anywhere
  const unlockAudioOnce = () => {
    spatialAudioManager.unlock();
    window.removeEventListener('pointerdown', unlockAudioOnce);
    window.removeEventListener('keydown', unlockAudioOnce);
  };
  window.addEventListener('pointerdown', unlockAudioOnce, { passive: true });
  window.addEventListener('keydown', unlockAudioOnce, { passive: true });

  // Wire 2D DOM Export Button to open Live Crisis Preview Modal
  const btnExport2D = document.getElementById('btnExportDossier2D');

  if (btnExport2D) {
    btnExport2D.addEventListener('click', () => {
      btnExport2D.classList.add('opacity-75');
      try {
        const result = generateExecutiveDossierPDF({
          activeClusterId: observatory.telemetryPanel?.currentCluster || 'openbrain',
          liveTelemetry: observatory.telemetryPanel?.latestData,
        });
        observatory.lastDossierResult = result;
        observatory.dossierSpatialCard?.show(result);
        dossierPreviewModal.open(result);
      } catch (err) {
        console.error('Error opening dossier preview:', err);
      } finally {
        setTimeout(() => {
          btnExport2D.classList.remove('opacity-75');
        }, 400);
      }
    });
  }

  // Wire 2D Zen Toggle Button
  const btnToggleZen2D = document.getElementById('btnToggleZen2D');
  if (btnToggleZen2D) {
    btnToggleZen2D.addEventListener('click', () => {
      observatory.toggleZenMode();
    });
  }
});
