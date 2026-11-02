import * as THREE from 'three';
import * as xb from 'xrblocks';
import { ClusterTelemetry } from '../types.ts';
import { generateExecutiveDossierPDF, DossierGenerationResult } from '../services/dossierPdfService.ts';
import { spatialAudioManager } from '../services/spatialAudioManager.ts';
import { dossierPreviewModal } from './DossierPreviewModal.ts';
import { hapticsService } from '../services/hapticsService.ts';

export class TelemetryPanel extends xb.UICard {
  currentCluster: 'openbrain' | 'tianwan' | 'global' = 'openbrain';
  pollInterval?: number;
  pulseTime = 0;
  private audioUnsubscribe?: () => void;

  // Header Elements
  clusterLabelText: xb.UIText;
  statusBadgeText: xb.UIText;
  beaconText: xb.UIText;

  // Metric 1: FLOPs
  flopsValueText: xb.UIText;
  flopsBarText: xb.UIText;
  flopsSubText: xb.UIText;

  // Metric 2: Cooling & PUE
  pueValueText: xb.UIText;
  coolingBarText: xb.UIText;
  coolingSubText: xb.UIText;

  // Metric 3: Neural Temperature
  tempValueText: xb.UIText;
  tempBarText: xb.UIText;
  tempSubText: xb.UIText;

  // Metric 4: Active Agents
  agentsValueText: xb.UIText;
  agentsBarText: xb.UIText;
  agentsSubText: xb.UIText;

  // Footer Anomaly Note
  anomalyNoteText: xb.UIText;

  // Buttons for styling toggles
  usBtn: xb.UIButton;
  tianwanBtn: xb.UIButton;
  globalBtn: xb.UIButton;
  chartBtn: xb.UIButton;
  zenBtn: xb.UIButton;
  audioBtn: xb.UIButton;
  exportDossierBtn: xb.UIButton;
  latestData?: ClusterTelemetry;

  onToggleChart?: () => void;
  onClusterChanged?: (cluster: 'openbrain' | 'tianwan' | 'global') => void;
  onToggleFocus?: () => void;
  onOpenDossierPreview?: (result: DossierGenerationResult) => void;

  constructor(
    onToggleChart?: () => void,
    onClusterChanged?: (cluster: 'openbrain' | 'tianwan' | 'global') => void,
    onToggleFocus?: () => void,
    onOpenDossierPreview?: (result: DossierGenerationResult) => void
  ) {
    const cardSize = { width: 1.14, height: 0.36 };

    // --- Header ---
    const title = new xb.UIText({
      text: 'AI 2027 COMPUTE TELEMETRY',
      style: { fontSize: 18, fontWeight: 'bold', color: '#38bdf8' },
    });

    const beaconText = new xb.UIText({
      text: '● LIVE 2.5s',
      style: { fontSize: 12, fontWeight: 'bold', color: '#10b981' },
    });

    const statusBadgeText = new xb.UIText({
      text: 'OPTIMAL',
      style: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#10b981',
        backgroundColor: '#064e3b',
        padding: 4,
        paddingLeft: 8,
        paddingRight: 8,
        borderRadius: 6,
      },
    });

    const headerLeft = new xb.UIPanel({
      style: { flexDirection: 'row', alignItems: 'center', gap: 10 },
      children: [title, beaconText, statusBadgeText],
    });

    // Cluster Switcher Buttons
    const usBtn = new xb.UIButton({
      label: 'OpenBrain US',
      style: { height: 30, fontSize: 11, paddingLeft: 8, paddingRight: 8 },
      onClick: () => this.switchCluster('openbrain'),
    });

    const tianwanBtn = new xb.UIButton({
      label: 'Tianwan CDZ',
      style: { height: 30, fontSize: 11, paddingLeft: 8, paddingRight: 8 },
      onClick: () => this.switchCluster('tianwan'),
    });

    const globalBtn = new xb.UIButton({
      label: 'Global Grid',
      style: { height: 30, fontSize: 11, paddingLeft: 8, paddingRight: 8 },
      onClick: () => this.switchCluster('global'),
    });

    const chartBtn = new xb.UIButton({
      icon: 'show_chart',
      label: 'Gráfico 60s',
      style: { height: 30, fontSize: 11, paddingLeft: 8, paddingRight: 8, color: '#38bdf8' },
      onClick: () => {
        hapticsService.pulseMetricFocus();
        this.onToggleChart?.();
      },
    });

    const zenBtn = new xb.UIButton({
      icon: 'visibility',
      label: 'Foco 3D',
      style: { height: 30, fontSize: 11, paddingLeft: 8, paddingRight: 8, color: '#34d399' },
      onClick: () => {
        hapticsService.pulseClick();
        this.onToggleFocus?.();
      },
    });

    const audioBtn = new xb.UIButton({
      icon: 'volume_up',
      label: 'Áudio 3D',
      style: { height: 30, fontSize: 11, paddingLeft: 8, paddingRight: 8, color: '#a78bfa' },
      onClick: async () => {
        hapticsService.pulseClick();
        await spatialAudioManager.unlock();
        const isMuted = spatialAudioManager.toggleMute();
        audioBtn.label = isMuted ? 'Mudo' : 'Áudio 3D';
        audioBtn.icon = isMuted ? 'volume_off' : 'volume_up';
      },
    });

    const exportDossierBtn = new xb.UIButton({
      icon: 'description',
      label: 'Exportar Dossiê (PDF)',
      style: {
        height: 30,
        fontSize: 11,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: '#0284c7',
        color: '#ffffff',
      },
      onClick: () => {
        hapticsService.pulseDossierExport();
        void this.handleExportDossier();
      },
    });

    const clusterButtons = new xb.UIPanel({
      style: { flexDirection: 'row', gap: 6 },
      children: [usBtn, tianwanBtn, globalBtn, chartBtn, zenBtn, audioBtn, exportDossierBtn],
    });

    const header = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 4,
      },
      children: [headerLeft, clusterButtons],
    });

    const clusterLabelText = new xb.UIText({
      text: 'Cluster: OpenBrain US Frontier Mega-Cluster',
      style: { fontSize: 12, color: '#94a3b8' },
    });

    // --- Metric Cards (4 Columns) ---
    // Col 1: FLOPs Throughput
    const flopsTitle = new xb.UIText({
      text: 'COMPUTE THROUGHPUT',
      style: { fontSize: 11, fontWeight: 'bold', color: '#67e8f9' },
    });
    const flopsValueText = new xb.UIText({
      text: '3.85 x 10^28 FLOP/s',
      style: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
    });
    const flopsBarText = new xb.UIText({
      text: '■■■■■■■■□□ 82% Load',
      style: { fontSize: 11, color: '#38bdf8' },
    });
    const flopsSubText = new xb.UIText({
      text: 'Power: 14.6 GW Peak',
      style: { fontSize: 11, color: '#cbd5e1' },
    });
    const col1 = new xb.UIPanel({
      style: {
        flexGrow: 1,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#1e293b',
        flexDirection: 'column',
        gap: 3,
      },
      children: [flopsTitle, flopsValueText, flopsBarText, flopsSubText],
    });

    // Col 2: Cooling & PUE
    const coolingTitle = new xb.UIText({
      text: 'COOLING EFFICIENCY & PUE',
      style: { fontSize: 11, fontWeight: 'bold', color: '#6ee7b7' },
    });
    const pueValueText = new xb.UIText({
      text: 'PUE 1.11 (Cryo)',
      style: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
    });
    const coolingBarText = new xb.UIText({
      text: '■■■■■■■■■□ 94% Effic.',
      style: { fontSize: 11, color: '#34d399' },
    });
    const coolingSubText = new xb.UIText({
      text: 'Liquid Immersion Delta: Nominal',
      style: { fontSize: 11, color: '#cbd5e1' },
    });
    const col2 = new xb.UIPanel({
      style: {
        flexGrow: 1,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#1e293b',
        flexDirection: 'column',
        gap: 3,
      },
      children: [coolingTitle, pueValueText, coolingBarText, coolingSubText],
    });

    // Col 3: Neural Temperature
    const tempTitle = new xb.UIText({
      text: 'NEURAL ENTROPY TEMP',
      style: { fontSize: 11, fontWeight: 'bold', color: '#c084fc' },
    });
    const tempValueText = new xb.UIText({
      text: '0.724 θ (Stable)',
      style: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
    });
    const tempBarText = new xb.UIText({
      text: '■■■■■■■□□□ Recurrence',
      style: { fontSize: 11, color: '#a855f7' },
    });
    const tempSubText = new xb.UIText({
      text: 'Vector Drift: Low',
      style: { fontSize: 11, color: '#cbd5e1' },
    });
    const col3 = new xb.UIPanel({
      style: {
        flexGrow: 1,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#1e293b',
        flexDirection: 'column',
        gap: 3,
      },
      children: [tempTitle, tempValueText, tempBarText, tempSubText],
    });

    // Col 4: Active Agents
    const agentsTitle = new xb.UIText({
      text: 'PARALLEL AGENT INSTANCES',
      style: { fontSize: 11, fontWeight: 'bold', color: '#fcd34d' },
    });
    const agentsValueText = new xb.UIText({
      text: '300,000 Copies',
      style: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
    });
    const agentsBarText = new xb.UIText({
      text: '■■■■■■■■■■ 100% Sync',
      style: { fontSize: 11, color: '#f59e0b' },
    });
    const agentsSubText = new xb.UIText({
      text: 'Thinking Speed: 50x Human',
      style: { fontSize: 11, color: '#cbd5e1' },
    });
    const col4 = new xb.UIPanel({
      style: {
        flexGrow: 1,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#1e293b',
        flexDirection: 'column',
        gap: 3,
      },
      children: [agentsTitle, agentsValueText, agentsBarText, agentsSubText],
    });

    const metricsGrid = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'space-between',
      },
      children: [col1, col2, col3, col4],
    });

    // --- Footer Anomaly Ticker ---
    const anomalyNoteText = new xb.UIText({
      text: 'Diagnostic Status: Cryogenic immersion cooling nominal. 300k Agent-4 copies synchronized.',
      style: {
        width: '100%',
        fontSize: 11,
        color: '#94a3b8',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        padding: 6,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 6,
      },
    });

    super({
      size: cardSize,
      manipulation: true,
      edge: true,
      style: {
        flexDirection: 'column',
        gap: 8,
        padding: 14,
        backgroundColor: '#030712ea',
        borderWidth: 1,
        borderColor: '#0284c7',
      },
      children: [header, clusterLabelText, metricsGrid, anomalyNoteText],
    });

    this.clusterLabelText = clusterLabelText;
    this.statusBadgeText = statusBadgeText;
    this.beaconText = beaconText;

    this.flopsValueText = flopsValueText;
    this.flopsBarText = flopsBarText;
    this.flopsSubText = flopsSubText;

    this.pueValueText = pueValueText;
    this.coolingBarText = coolingBarText;
    this.coolingSubText = coolingSubText;

    this.tempValueText = tempValueText;
    this.tempBarText = tempBarText;
    this.tempSubText = tempSubText;

    this.agentsValueText = agentsValueText;
    this.agentsBarText = agentsBarText;
    this.agentsSubText = agentsSubText;

    this.anomalyNoteText = anomalyNoteText;

    this.usBtn = usBtn;
    this.tianwanBtn = tianwanBtn;
    this.globalBtn = globalBtn;
    this.chartBtn = chartBtn;
    this.zenBtn = zenBtn;
    this.audioBtn = audioBtn;
    this.exportDossierBtn = exportDossierBtn;

    this.onToggleChart = onToggleChart;
    this.onClusterChanged = onClusterChanged;
    this.onToggleFocus = onToggleFocus;

    // Synchronize 3D button with audio manager state
    this.audioUnsubscribe = spatialAudioManager.subscribe((state) => {
      if (this.audioBtn) {
        this.audioBtn.label = !state.enabled ? 'Mudo' : 'Áudio 3D';
        this.audioBtn.icon = !state.enabled ? 'volume_off' : 'volume_up';
      }
    });

    this.startPolling();
  }

  async handleExportDossier() {
    this.exportDossierBtn.label = 'Gerando Prévia...';
    this.exportDossierBtn.disabled = true;
    try {
      const result = generateExecutiveDossierPDF({
        activeClusterId: this.currentCluster,
        liveTelemetry: this.latestData,
      });
      dossierPreviewModal.open(result);
      this.onOpenDossierPreview?.(result);

      this.exportDossierBtn.label = '✓ Prévia Aberta';
      this.exportDossierBtn.style.backgroundColor = '#059669';
      setTimeout(() => {
        this.exportDossierBtn.label = 'Exportar Dossiê (PDF)';
        this.exportDossierBtn.style.backgroundColor = '#0284c7';
        this.exportDossierBtn.disabled = false;
      }, 2500);
    } catch (err) {
      console.error('Error generating PDF dossier preview:', err);
      this.exportDossierBtn.label = 'Erro ao gerar';
      this.exportDossierBtn.disabled = false;
    }
  }

  switchCluster(cluster: 'openbrain' | 'tianwan' | 'global') {
    this.currentCluster = cluster;
    hapticsService.pulseClusterSwitch();
    spatialAudioManager.unlock();
    spatialAudioManager.setCluster(cluster);
    this.fetchTelemetry();
    this.onClusterChanged?.(cluster);
  }

  startPolling() {
    this.fetchTelemetry();
    if (typeof window !== 'undefined') {
      this.pollInterval = window.setInterval(() => {
        this.fetchTelemetry();
      }, 2500);
    }
  }

  async fetchTelemetry() {
    try {
      const res = await fetch(`/api/telemetry?cluster=${this.currentCluster}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ClusterTelemetry = await res.json();
      this.renderTelemetry(data);
    } catch (err: any) {
      // Fallback local simulation if network glitch
      this.renderFallback();
    }
  }

  renderTelemetry(data: ClusterTelemetry) {
    this.latestData = data;
    this.clusterLabelText.text = `Cluster: ${data.clusterName}`;
    this.statusBadgeText.text = data.statusBadge;

    if (data.statusBadge === 'ANOMALY DETECTED') {
      this.statusBadgeText.style.color = '#f87171';
      this.statusBadgeText.style.backgroundColor = '#7f1d1d';
      this.anomalyNoteText.style.color = '#fca5a5';
      spatialAudioManager.playNeuraleseChime(2093); // Alert harmonic
      hapticsService.pulseAnomalyAlert();
    } else if (data.statusBadge === 'LOADED') {
      this.statusBadgeText.style.color = '#fbbf24';
      this.statusBadgeText.style.backgroundColor = '#78350f';
      this.anomalyNoteText.style.color = '#fde68a';
    } else {
      this.statusBadgeText.style.color = '#34d399';
      this.statusBadgeText.style.backgroundColor = '#064e3b';
      this.anomalyNoteText.style.color = '#94a3b8';
    }

    // Col 1: FLOPs
    this.flopsValueText.text = data.activeFlops;
    const flopsLoad = Math.min(100, Math.round((data.flopsNumeric / 1e29) * 100 * 2.5));
    this.flopsBarText.text = `${this.buildBar(flopsLoad)} ${flopsLoad}% Load`;
    this.flopsSubText.text = `Power: ${data.powerDrawGw} GW Peak`;

    // Col 2: Cooling & PUE
    this.pueValueText.text = `PUE ${data.pue.toFixed(2)}`;
    this.coolingBarText.text = `${this.buildBar(data.coolingEfficiencyPct)} ${data.coolingEfficiencyPct}% Effic.`;
    this.coolingSubText.text = `Status: ${data.coolingStatus}`;

    // Col 3: Neural Temperature
    this.tempValueText.text = `${data.neuralTemperature.toFixed(3)} θ`;
    const tempPct = Math.min(100, Math.round(data.neuralTemperature * 100));
    this.tempBarText.text = `${this.buildBar(tempPct)} Entropy`;
    this.tempSubText.text = `Containment: ${data.containmentIntegrityPct.toFixed(1)}%`;

    // Col 4: Active Agents
    this.agentsValueText.text = `${data.activeAgentInstances.toLocaleString()} Copies`;
    const agentPct = Math.min(100, Math.round((data.activeAgentInstances / 300000) * 100));
    this.agentsBarText.text = `${this.buildBar(agentPct)} Active`;
    this.agentsSubText.text = data.clusterId === 'openbrain' ? 'Speed: 50x Human' : 'Speed: 25x Human';

    // Anomaly Note
    this.anomalyNoteText.text = `Diagnostic Status: ${data.anomalyNote || 'Operating within standard parameters.'}`;
  }

  renderFallback() {
    this.flopsValueText.text = '3.85 x 10^28 FLOP/s';
    this.pueValueText.text = 'PUE 1.11 (Cryo)';
    this.tempValueText.text = '0.724 θ';
    this.agentsValueText.text = '300,000 Copies';
    this.anomalyNoteText.text = 'Diagnostic Status: Telemetry operating on cached baseline synchronization.';
  }

  buildBar(pct: number): string {
    const totalBlocks = 10;
    const filled = Math.min(totalBlocks, Math.max(0, Math.round((pct / 100) * totalBlocks)));
    const empty = totalBlocks - filled;
    return '■'.repeat(filled) + '□'.repeat(empty);
  }

  updateBeacon(delta: number) {
    this.pulseTime += delta;
    const isBlink = Math.floor(this.pulseTime * 2) % 2 === 0;
    this.beaconText.style.opacity = isBlink ? 1.0 : 0.4;
  }

  dispose() {
    if (this.audioUnsubscribe) {
      this.audioUnsubscribe();
      this.audioUnsubscribe = undefined;
    }
    if (this.pollInterval && typeof window !== 'undefined') {
      window.clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }
}
