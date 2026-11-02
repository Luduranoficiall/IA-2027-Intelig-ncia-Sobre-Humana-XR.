import * as THREE from 'three';
import * as xb from 'xrblocks';
import { ClusterTelemetry, TelemetryHistoryPoint } from '../types.ts';
import { hapticsService } from '../services/hapticsService.ts';

/**
 * TelemetryHistoryChart
 * A spatial UI chart component modeled after Recharts dual-axis line/area charts,
 * rendering a 60-second sliding history of FLOP/s throughput and Neural Temperature.
 */
export class TelemetryHistoryChart extends xb.UICard {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  chartTexture: THREE.CanvasTexture;
  chartImage: xb.UIImage;

  currentCluster: 'openbrain' | 'tianwan' | 'global' = 'openbrain';
  historyPoints: TelemetryHistoryPoint[] = [];

  showFlops = true;
  showTemp = true;

  // Header and stat labels
  clusterBadgeText: xb.UIText;
  statsText: xb.UIText;
  statusText: xb.UIText;

  pollInterval?: number;

  constructor(initialCluster: 'openbrain' | 'tianwan' | 'global' = 'openbrain') {
    const cardSize = { width: 0.94, height: 0.58 };

    // Set up high-resolution canvas for Recharts-style rendering
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 620;
    const context = canvas.getContext('2d');

    const chartTexture = new THREE.CanvasTexture(canvas);
    chartTexture.colorSpace = THREE.SRGBColorSpace;
    chartTexture.minFilter = THREE.LinearFilter;
    chartTexture.magFilter = THREE.LinearFilter;

    const chartImage = new xb.UIImage({
      src: chartTexture,
      ariaLabel: '60-Second Telemetry History Chart',
      pointerEvents: 'none',
      style: {
        width: '100%',
        height: 290,
        borderRadius: 12,
        backgroundColor: '#070d18',
        objectFit: 'contain',
      },
    });

    // --- Header ---
    const headerTitle = new xb.UIText({
      text: '60s TELEMETRY HISTORY (RECHARTS STYLE)',
      style: { fontSize: 18, fontWeight: 'bold', color: '#38bdf8' },
    });

    const clusterBadgeText = new xb.UIText({
      text: 'Cluster: OpenBrain US',
      style: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#67e8f9',
        backgroundColor: '#083344',
        padding: 4,
        paddingLeft: 8,
        paddingRight: 8,
        borderRadius: 6,
      },
    });

    const header = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      children: [headerTitle, clusterBadgeText],
    });

    // --- Controls Row (Cluster Switchers & Line Toggles) ---
    const usBtn = new xb.UIButton({
      label: 'OpenBrain US',
      style: { height: 32, fontSize: 11, paddingLeft: 8, paddingRight: 8 },
      onClick: () => this.switchCluster('openbrain'),
    });

    const tianwanBtn = new xb.UIButton({
      label: 'Tianwan CDZ',
      style: { height: 32, fontSize: 11, paddingLeft: 8, paddingRight: 8 },
      onClick: () => this.switchCluster('tianwan'),
    });

    const globalBtn = new xb.UIButton({
      label: 'Global Grid',
      style: { height: 32, fontSize: 11, paddingLeft: 8, paddingRight: 8 },
      onClick: () => this.switchCluster('global'),
    });

    const toggleFlopsBtn = new xb.UIButton({
      label: '● FLOP/s Line',
      style: { height: 32, fontSize: 11, paddingLeft: 8, paddingRight: 8, color: '#38bdf8' },
      onClick: () => {
        hapticsService.pulseMetricFocus();
        this.showFlops = !this.showFlops;
        this.drawChart();
      },
    });

    const toggleTempBtn = new xb.UIButton({
      label: '● Temp θ Line',
      style: { height: 32, fontSize: 11, paddingLeft: 8, paddingRight: 8, color: '#c084fc' },
      onClick: () => {
        hapticsService.pulseMetricFocus();
        this.showTemp = !this.showTemp;
        this.drawChart();
      },
    });

    const refreshBtn = new xb.UIButton({
      icon: 'refresh',
      label: 'Refresh',
      style: { height: 32, fontSize: 11 },
      onClick: () => {
        hapticsService.pulseClick();
        this.fetchHistory();
      },
    });

    const controlsRow = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
      },
      children: [usBtn, tianwanBtn, globalBtn, toggleFlopsBtn, toggleTempBtn, refreshBtn],
    });

    // Stats bar
    const statsText = new xb.UIText({
      text: 'Peak FLOPs: -- | Mean Temp: -- | Range: -60s to Present (Sampled every 2s)',
      style: { fontSize: 12, color: '#cbd5e1' },
    });

    const statusText = new xb.UIText({
      text: 'Streaming 60s window from simulated AI 2027 server…',
      style: { fontSize: 11, color: '#94a3b8' },
    });

    const footer = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 4,
      },
      children: [statsText, statusText],
    });

    super({
      size: cardSize,
      manipulation: true,
      edge: true,
      style: {
        flexDirection: 'column',
        gap: 8,
        padding: 16,
        backgroundColor: '#040b17fa',
        borderWidth: 1,
        borderColor: '#0369a1',
      },
      children: [header, controlsRow, chartImage, footer],
    });

    this.canvas = canvas;
    this.context = context;
    this.chartTexture = chartTexture;
    this.chartImage = chartImage;

    this.clusterBadgeText = clusterBadgeText;
    this.statsText = statsText;
    this.statusText = statusText;
    this.currentCluster = initialCluster;

    this.startPolling();
  }

  switchCluster(cluster: 'openbrain' | 'tianwan' | 'global') {
    this.currentCluster = cluster;
    hapticsService.pulseClusterSwitch();
    const name =
      cluster === 'openbrain'
        ? 'OpenBrain US'
        : cluster === 'tianwan'
          ? 'Tianwan CDZ'
          : 'Global Grid';
    this.clusterBadgeText.text = `Cluster: ${name}`;
    this.fetchHistory();
  }

  startPolling() {
    this.fetchHistory();
    if (typeof window !== 'undefined') {
      this.pollInterval = window.setInterval(() => {
        this.fetchHistory();
      }, 2500);
    }
  }

  async fetchHistory() {
    try {
      const res = await fetch(`/api/telemetry?cluster=${this.currentCluster}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ClusterTelemetry = await res.json();
      if (data.history && data.history.length > 0) {
        this.historyPoints = data.history;
      }
      this.updateStats(data);
      this.drawChart();
      this.statusText.text = `Live 60s stream active • ${this.historyPoints.length} datapoints`;
    } catch (err: any) {
      this.statusText.text = 'Using cached history simulation';
      this.drawChart();
    }
  }

  updateStats(data: ClusterTelemetry) {
    if (this.historyPoints.length === 0) return;
    const peakFlops = Math.max(...this.historyPoints.map((p) => p.flopsNumeric));
    const avgTemp =
      this.historyPoints.reduce((acc, p) => acc + p.neuralTemperature, 0) /
      this.historyPoints.length;
    this.statsText.text = `Peak: ${(peakFlops / 1e28).toFixed(2)}x10²⁸ FLOP/s | Mean Temp: ${avgTemp.toFixed(3)}θ | Window: -60s to Now`;
  }

  /**
   * Renders the dual-line chart with Recharts styling:
   * - Left Axis: FLOP/s (Cyan)
   * - Right Axis: Neural Temperature (Purple)
   * - Smooth Monotone Bezier Curves with Area Gradients
   * - Gridlines and X-Axis time labels
   */
  drawChart() {
    const { canvas, context, chartTexture } = this;
    if (!context) return;

    const w = canvas.width;
    const h = canvas.height;

    // Chart margins
    const padLeft = 90;
    const padRight = 80;
    const padTop = 60;
    const padBottom = 60;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Clear background
    context.fillStyle = '#060d1b';
    context.fillRect(0, 0, w, h);

    // Subtle inner border
    context.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    context.lineWidth = 1;
    context.strokeRect(padLeft, padTop, plotW, plotH);

    // Generate fallback data if points empty
    const points = this.historyPoints.length > 0 ? this.historyPoints : this.getFallbackPoints();

    // Compute min / max scales
    const flopsValues = points.map((p) => p.flopsNumeric);
    const maxFlops = Math.max(...flopsValues, 1e28) * 1.15;
    const minFlops = 0;

    const minTemp = 0.4;
    const maxTemp = 1.05;

    // Draw horizontal dashed grid lines (5 levels)
    const gridLevels = 5;
    context.font = '13px Roboto, sans-serif';
    context.textAlign = 'right';
    context.textBaseline = 'middle';

    for (let i = 0; i <= gridLevels; i++) {
      const y = padTop + (plotH / gridLevels) * i;
      const t = 1 - i / gridLevels;

      // Grid line
      context.beginPath();
      context.setLineDash([4, 4]);
      context.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      context.moveTo(padLeft, y);
      context.lineTo(padLeft + plotW, y);
      context.stroke();
      context.setLineDash([]);

      // Left Y-Axis label (FLOP/s)
      const flopsVal = minFlops + t * (maxFlops - minFlops);
      context.fillStyle = '#38bdf8';
      context.textAlign = 'right';
      context.fillText(`${(flopsVal / 1e28).toFixed(1)} x 10²⁸`, padLeft - 12, y);

      // Right Y-Axis label (Neural Temp)
      const tempVal = minTemp + t * (maxTemp - minTemp);
      context.fillStyle = '#c084fc';
      context.textAlign = 'left';
      context.fillText(`${tempVal.toFixed(2)} θ`, padLeft + plotW + 12, y);
    }

    // Draw X-Axis Ticks & Time labels (-60s, -45s, -30s, -15s, Now)
    const timeTicks = [
      { offset: -60, label: '-60s' },
      { offset: -45, label: '-45s' },
      { offset: -30, label: '-30s' },
      { offset: -15, label: '-15s' },
      { offset: 0, label: 'Now' },
    ];

    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillStyle = '#94a3b8';
    context.font = '14px Roboto, sans-serif';

    for (const tick of timeTicks) {
      const x = padLeft + ((tick.offset + 60) / 60) * plotW;
      context.fillText(tick.label, x, padTop + plotH + 12);

      context.beginPath();
      context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      context.moveTo(x, padTop + plotH);
      context.lineTo(x, padTop + plotH + 6);
      context.stroke();
    }

    // Helpers to map data point to pixel coordinates
    const getX = (timeOffset: number) => padLeft + ((timeOffset + 60) / 60) * plotW;
    const getYFlops = (val: number) =>
      padTop + plotH - ((val - minFlops) / (maxFlops - minFlops)) * plotH;
    const getYTemp = (val: number) =>
      padTop + plotH - ((val - minTemp) / (maxTemp - minTemp)) * plotH;

    // --- Draw FLOP/s Area & Curve (Recharts Cyan Theme) ---
    if (this.showFlops && points.length > 1) {
      // 1. Area fill gradient
      const flopsGrad = context.createLinearGradient(0, padTop, 0, padTop + plotH);
      flopsGrad.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
      flopsGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

      context.beginPath();
      context.moveTo(getX(points[0].timeOffsetSec), padTop + plotH);

      for (let i = 0; i < points.length; i++) {
        const x = getX(points[i].timeOffsetSec);
        const y = getYFlops(points[i].flopsNumeric);
        if (i === 0) context.lineTo(x, y);
        else {
          const prevX = getX(points[i - 1].timeOffsetSec);
          const prevY = getYFlops(points[i - 1].flopsNumeric);
          const midX = (prevX + x) / 2;
          context.bezierCurveTo(midX, prevY, midX, y, x, y);
        }
      }
      context.lineTo(getX(points[points.length - 1].timeOffsetSec), padTop + plotH);
      context.closePath();
      context.fillStyle = flopsGrad;
      context.fill();

      // 2. Stroke line
      context.beginPath();
      for (let i = 0; i < points.length; i++) {
        const x = getX(points[i].timeOffsetSec);
        const y = getYFlops(points[i].flopsNumeric);
        if (i === 0) context.moveTo(x, y);
        else {
          const prevX = getX(points[i - 1].timeOffsetSec);
          const prevY = getYFlops(points[i - 1].flopsNumeric);
          const midX = (prevX + x) / 2;
          context.bezierCurveTo(midX, prevY, midX, y, x, y);
        }
      }
      context.strokeStyle = '#06b6d4';
      context.lineWidth = 3.5;
      context.shadowColor = '#06b6d4';
      context.shadowBlur = 8;
      context.stroke();
      context.shadowBlur = 0;

      // 3. Highlight last node
      const lastPoint = points[points.length - 1];
      const lastX = getX(lastPoint.timeOffsetSec);
      const lastY = getYFlops(lastPoint.flopsNumeric);

      context.beginPath();
      context.arc(lastX, lastY, 5, 0, Math.PI * 2);
      context.fillStyle = '#06b6d4';
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = '#ffffff';
      context.stroke();
    }

    // --- Draw Neural Temperature Area & Curve (Recharts Purple Theme) ---
    if (this.showTemp && points.length > 1) {
      // 1. Area fill gradient
      const tempGrad = context.createLinearGradient(0, padTop, 0, padTop + plotH);
      tempGrad.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
      tempGrad.addColorStop(1, 'rgba(168, 85, 247, 0.0)');

      context.beginPath();
      context.moveTo(getX(points[0].timeOffsetSec), padTop + plotH);

      for (let i = 0; i < points.length; i++) {
        const x = getX(points[i].timeOffsetSec);
        const y = getYTemp(points[i].neuralTemperature);
        if (i === 0) context.lineTo(x, y);
        else {
          const prevX = getX(points[i - 1].timeOffsetSec);
          const prevY = getYTemp(points[i - 1].neuralTemperature);
          const midX = (prevX + x) / 2;
          context.bezierCurveTo(midX, prevY, midX, y, x, y);
        }
      }
      context.lineTo(getX(points[points.length - 1].timeOffsetSec), padTop + plotH);
      context.closePath();
      context.fillStyle = tempGrad;
      context.fill();

      // 2. Stroke line
      context.beginPath();
      for (let i = 0; i < points.length; i++) {
        const x = getX(points[i].timeOffsetSec);
        const y = getYTemp(points[i].neuralTemperature);
        if (i === 0) context.moveTo(x, y);
        else {
          const prevX = getX(points[i - 1].timeOffsetSec);
          const prevY = getYTemp(points[i - 1].neuralTemperature);
          const midX = (prevX + x) / 2;
          context.bezierCurveTo(midX, prevY, midX, y, x, y);
        }
      }
      context.strokeStyle = '#a855f7';
      context.lineWidth = 3.5;
      context.shadowColor = '#a855f7';
      context.shadowBlur = 8;
      context.stroke();
      context.shadowBlur = 0;

      // 3. Highlight last node
      const lastPoint = points[points.length - 1];
      const lastX = getX(lastPoint.timeOffsetSec);
      const lastY = getYTemp(lastPoint.neuralTemperature);

      context.beginPath();
      context.arc(lastX, lastY, 5, 0, Math.PI * 2);
      context.fillStyle = '#a855f7';
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = '#ffffff';
      context.stroke();
    }

    // Chart Title Legend inside Canvas
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.font = 'bold 15px Roboto, sans-serif';

    // Cyan Legend Item
    context.fillStyle = '#06b6d4';
    context.fillRect(padLeft, 22, 14, 14);
    context.fillStyle = '#f8fafc';
    context.fillText('FLOP/s (Left)', padLeft + 20, 22);

    // Purple Legend Item
    context.fillStyle = '#a855f7';
    context.fillRect(padLeft + 150, 22, 14, 14);
    context.fillStyle = '#f8fafc';
    context.fillText('Neural Temp θ (Right)', padLeft + 170, 22);

    // Live Watermark in top right
    context.textAlign = 'right';
    context.fillStyle = '#64748b';
    context.font = '13px Roboto, sans-serif';
    context.fillText('Window: Last 60s Sliding Buffer', padLeft + plotW, 22);

    chartTexture.needsUpdate = true;
  }

  getFallbackPoints(): TelemetryHistoryPoint[] {
    const fallback: TelemetryHistoryPoint[] = [];
    const now = Date.now();
    for (let sec = -60; sec <= 0; sec += 2) {
      const wave = Math.sin(sec * 0.2) * 0.06;
      fallback.push({
        timeOffsetSec: sec,
        timestamp: now + sec * 1000,
        flopsNumeric: 3.8e28 * (1 + wave),
        flopsFormatted: `${(3.8 * (1 + wave)).toFixed(2)} x 10^28`,
        neuralTemperature: 0.72 + wave * 0.8,
        coolingEfficiencyPct: 93,
      });
    }
    return fallback;
  }

  dispose() {
    if (this.pollInterval && typeof window !== 'undefined') {
      window.clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    this.chartTexture.dispose();
  }
}
