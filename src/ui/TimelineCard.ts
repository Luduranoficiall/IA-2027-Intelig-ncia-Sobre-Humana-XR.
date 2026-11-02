import * as THREE from 'three';
import * as xb from 'xrblocks';
import { SCENARIO_CHAPTERS } from '../data/scenarioData.ts';
import { TimelineChapter, VisualizationMode } from '../types.ts';
import { hapticsService } from '../services/hapticsService.ts';

export class TimelineCard extends xb.UICard {
  currentIndex = 0;
  onChapterChanged?: (chapter: TimelineChapter) => void;
  onModeChanged?: (mode: VisualizationMode) => void;

  titleText: xb.UIText;
  periodBadge: xb.UIText;
  summaryText: xb.UIText;
  metricsText: xb.UIText;
  quoteText: xb.UIText;
  counterText: xb.UIText;

  constructor(
    onChapterChanged?: (chapter: TimelineChapter) => void,
    onModeChanged?: (mode: VisualizationMode) => void
  ) {
    const cardSize = { width: 0.68, height: 0.78 };

    // Initial dummy components to be replaced/configured
    const headerTitle = new xb.UIText({
      text: 'AI 2027 TIMELINE',
      style: { fontSize: 26, fontWeight: 'bold', color: '#00f0ff' },
    });

    const periodBadge = new xb.UIText({
      text: 'Mid 2025',
      style: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff',
        backgroundColor: '#1e293b',
        padding: 6,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 8,
      },
    });

    const counterText = new xb.UIText({
      text: `1 / ${SCENARIO_CHAPTERS.length}`,
      style: { fontSize: 14, opacity: 0.6 },
    });

    const header = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      children: [headerTitle, periodBadge, counterText],
    });

    const titleText = new xb.UIText({
      text: SCENARIO_CHAPTERS[0].title,
      style: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginTop: 4 },
    });

    const summaryText = new xb.UIText({
      text: SCENARIO_CHAPTERS[0].summary,
      style: { fontSize: 15, lineHeight: 1.4, color: '#e2e8f0' },
    });

    const metricsText = new xb.UIText({
      text: 'Compute: 10^26 FLOPs | Power: 4 GW | Progress: 1.1x',
      style: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        padding: 10,
        borderRadius: 10,
      },
    });

    const quoteText = new xb.UIText({
      text: `“${SCENARIO_CHAPTERS[0].quote || ''}”`,
      style: {
        fontSize: 13,
        lineHeight: 1.35,
        color: '#cbd5e1',
        paddingLeft: 10,
      },
    });

    const contentScroll = new xb.UIScrollView({
      style: { flexGrow: 1, gap: 14, paddingRight: 4 },
      children: [titleText, summaryText, metricsText, quoteText],
    });

    // Navigation buttons
    const prevBtn = new xb.UIButton({
      label: 'Prev',
      icon: 'arrow_back',
      style: { flexGrow: 1, height: 44 },
      onClick: () => this.step(-1),
    });

    const nextBtn = new xb.UIButton({
      label: 'Next',
      icon: 'arrow_forward',
      style: { flexGrow: 1, height: 44 },
      onClick: () => this.step(1),
    });

    const voiceBtn = new xb.UIButton({
      icon: 'volume_up',
      label: 'Narration',
      style: { flexGrow: 1, height: 44 },
      onClick: () => this.speakChapter(),
    });

    const modeBtn = new xb.UIButton({
      icon: '3d_rotation',
      label: '3D Focus',
      style: { flexGrow: 1, height: 44 },
      onClick: () => this.toggleStageMode(),
    });

    const buttonRow1 = new xb.UIPanel({
      style: { width: '100%', flexDirection: 'row', gap: 10 },
      children: [prevBtn, nextBtn],
    });

    const buttonRow2 = new xb.UIPanel({
      style: { width: '100%', flexDirection: 'row', gap: 10 },
      children: [modeBtn, voiceBtn],
    });

    super({
      size: cardSize,
      manipulation: true,
      edge: true,
      style: {
        flexDirection: 'column',
        gap: 14,
        padding: 20,
        backgroundColor: '#0a0f1dcc',
      },
      children: [header, contentScroll, buttonRow1, buttonRow2],
    });

    this.titleText = titleText;
    this.periodBadge = periodBadge;
    this.summaryText = summaryText;
    this.metricsText = metricsText;
    this.quoteText = quoteText;
    this.counterText = counterText;

    this.onChapterChanged = onChapterChanged;
    this.onModeChanged = onModeChanged;

    this.updateDisplay();
  }

  step(delta: number) {
    hapticsService.pulseMetricFocus();
    this.currentIndex = (this.currentIndex + delta + SCENARIO_CHAPTERS.length) % SCENARIO_CHAPTERS.length;
    this.updateDisplay();
  }

  jumpTo(index: number) {
    if (index >= 0 && index < SCENARIO_CHAPTERS.length) {
      hapticsService.pulseMetricFocus();
      this.currentIndex = index;
      this.updateDisplay();
    }
  }

  updateDisplay() {
    const ch = SCENARIO_CHAPTERS[this.currentIndex];
    this.periodBadge.text = ch.period;
    this.titleText.text = ch.title;
    this.summaryText.text = ch.summary;
    this.counterText.text = `${this.currentIndex + 1} / ${SCENARIO_CHAPTERS.length}`;

    // Format metrics string
    const m = ch.metrics;
    const parts: string[] = [];
    if (m.flops) parts.push(`Compute: ${m.flops}`);
    if (m.powerGw) parts.push(`Power: ${m.powerGw}`);
    if (m.researchMultiplier) parts.push(`R&D: ${m.researchMultiplier}`);
    if (m.speedVsHuman) parts.push(`Speed: ${m.speedVsHuman}`);
    if (m.capex) parts.push(`Capex: ${m.capex}`);
    if (m.approval) parts.push(`Approval: ${m.approval}`);
    this.metricsText.text = parts.join(' • ');

    this.quoteText.text = ch.quote ? `“${ch.quote}”` : '';

    this.onChapterChanged?.(ch);
  }

  toggleStageMode() {
    hapticsService.pulseClick();
    const ch = SCENARIO_CHAPTERS[this.currentIndex];
    this.onModeChanged?.(ch.recommended3DMode);
  }

  speakChapter() {
    const ch = SCENARIO_CHAPTERS[this.currentIndex];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(ch.audioPromptText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }
}
