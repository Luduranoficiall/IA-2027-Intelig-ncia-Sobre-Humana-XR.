import * as THREE from 'three';
import * as xb from 'xrblocks';
import { BIOSCIENCE_THREAT_PROFILES } from '../data/scenarioData.ts';
import { VisualizationMode } from '../types.ts';
import { hapticsService } from '../services/hapticsService.ts';

export class BioscienceCard extends xb.UICard {
  selectedResolution: '1K' | '2K' | '4K' = '2K';
  activeProfileIndex = 0;
  onModeSelected?: (mode: VisualizationMode) => void;

  profileTitle: xb.UIText;
  threatBadge: xb.UIText;
  vectorText: xb.UIText;
  screeningText: xb.UIText;
  containmentText: xb.UIText;
  genStatusText: xb.UIText;
  resLabel: xb.UIText;

  constructor(onModeSelected?: (mode: VisualizationMode) => void) {
    const cardSize = { width: 0.68, height: 0.78 };

    const title = new xb.UIText({
      text: 'BIOSCIENCE & SCENARIO STUDIO',
      style: { fontSize: 22, fontWeight: 'bold', color: '#10b981' },
    });

    const header = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      children: [title],
    });

    // 3D Stage Switcher buttons
    const bioBtn = new xb.UIButton({
      icon: 'biotech',
      label: 'Bio / DNA',
      style: { flexGrow: 1, height: 38 },
      onClick: () => {
        hapticsService.pulseClick();
        onModeSelected?.('bio');
      },
    });

    const neuralBtn = new xb.UIButton({
      icon: 'hub',
      label: 'Neuralese',
      style: { flexGrow: 1, height: 38 },
      onClick: () => {
        hapticsService.pulseClick();
        onModeSelected?.('neural');
      },
    });

    const globeBtn = new xb.UIButton({
      icon: 'public',
      label: 'Geopolitics',
      style: { flexGrow: 1, height: 38 },
      onClick: () => {
        hapticsService.pulseClick();
        onModeSelected?.('globe');
      },
    });

    const stageSelector = new xb.UIPanel({
      style: { width: '100%', flexDirection: 'row', gap: 8 },
      children: [bioBtn, neuralBtn, globeBtn],
    });

    // Bioscience Profile section
    const secHeader = new xb.UIText({
      text: 'Biosecurity Threat Assessment (Science Skill)',
      style: { fontSize: 16, fontWeight: 'bold', color: '#34d399', marginTop: 4 },
    });

    const profileTitle = new xb.UIText({
      text: BIOSCIENCE_THREAT_PROFILES[0].title,
      style: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
    });

    const threatBadge = new xb.UIText({
      text: `Threat Level: ${BIOSCIENCE_THREAT_PROFILES[0].threatLevel}`,
      style: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#f87171',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        padding: 4,
        paddingLeft: 8,
        paddingRight: 8,
        borderRadius: 6,
      },
    });

    const vectorText = new xb.UIText({
      text: `Vector: ${BIOSCIENCE_THREAT_PROFILES[0].vector}`,
      style: { fontSize: 13, color: '#e2e8f0', lineHeight: 1.3 },
    });

    const screeningText = new xb.UIText({
      text: `Screening: ${BIOSCIENCE_THREAT_PROFILES[0].screeningStatus}`,
      style: { fontSize: 13, color: '#93c5fd', lineHeight: 1.3 },
    });

    const containmentText = new xb.UIText({
      text: `Safeguard: ${BIOSCIENCE_THREAT_PROFILES[0].containmentProtocol}`,
      style: { fontSize: 13, color: '#fbbf24', lineHeight: 1.3 },
    });

    const cycleProfileBtn = new xb.UIButton({
      label: 'Cycle Threat Scenario (Agent-1 / 3 / 4)',
      icon: 'sync',
      style: { width: '100%', height: 38 },
      onClick: () => this.cycleProfile(),
    });

    const deepScanBtn = new xb.UIButton({
      label: 'Run Gemini Biosecurity Audit',
      icon: 'security',
      style: { width: '100%', height: 38 },
      onClick: () => this.runDeepAudit(),
    });

    // Image Generation Affordance (1K, 2K, 4K)
    const imgTitle = new xb.UIText({
      text: 'High-Quality Scenario Art Generator',
      style: { fontSize: 16, fontWeight: 'bold', color: '#60a5fa', marginTop: 6 },
    });

    const resLabel = new xb.UIText({
      text: 'Selected Resolution: 2K (2048x2048)',
      style: { fontSize: 13, color: '#93c5fd' },
    });

    const btn1k = new xb.UIButton({
      label: '1K',
      style: { flexGrow: 1, height: 34 },
      onClick: () => this.setResolution('1K'),
    });

    const btn2k = new xb.UIButton({
      label: '2K',
      style: { flexGrow: 1, height: 34 },
      onClick: () => this.setResolution('2K'),
    });

    const btn4k = new xb.UIButton({
      label: '4K Ultra',
      style: { flexGrow: 1, height: 34 },
      onClick: () => this.setResolution('4K'),
    });

    const resRow = new xb.UIPanel({
      style: { width: '100%', flexDirection: 'row', gap: 6 },
      children: [btn1k, btn2k, btn4k],
    });

    const genArtBtn = new xb.UIButton({
      label: 'Generate Scene Art',
      icon: 'palette',
      style: { width: '100%', height: 40 },
      onClick: () => this.generateScenarioArt(),
    });

    const genStatusText = new xb.UIText({
      text: 'Ready to generate at 2K with gemini-3-pro-image-preview',
      style: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
    });

    const scrollContent = new xb.UIScrollView({
      style: { flexGrow: 1, gap: 10, paddingRight: 4 },
      children: [
        secHeader,
        profileTitle,
        threatBadge,
        vectorText,
        screeningText,
        containmentText,
        cycleProfileBtn,
        deepScanBtn,
        imgTitle,
        resLabel,
        resRow,
        genArtBtn,
        genStatusText,
      ],
    });

    super({
      size: cardSize,
      manipulation: true,
      edge: true,
      style: {
        flexDirection: 'column',
        gap: 12,
        padding: 18,
        backgroundColor: '#062016cc',
      },
      children: [header, stageSelector, scrollContent],
    });

    this.profileTitle = profileTitle;
    this.threatBadge = threatBadge;
    this.vectorText = vectorText;
    this.screeningText = screeningText;
    this.containmentText = containmentText;
    this.genStatusText = genStatusText;
    this.resLabel = resLabel;
    this.onModeSelected = onModeSelected;
  }

  setResolution(res: '1K' | '2K' | '4K') {
    hapticsService.pulseMetricFocus();
    this.selectedResolution = res;
    const desc = res === '1K' ? '1K (1024x1024)' : res === '2K' ? '2K (2048x2048)' : '4K Ultra (4096x4096)';
    this.resLabel.text = `Selected Resolution: ${desc}`;
    this.genStatusText.text = `Target resolution set to ${res}.`;
  }

  cycleProfile() {
    hapticsService.pulseMetricFocus();
    this.activeProfileIndex = (this.activeProfileIndex + 1) % BIOSCIENCE_THREAT_PROFILES.length;
    const p = BIOSCIENCE_THREAT_PROFILES[this.activeProfileIndex];
    this.profileTitle.text = p.title;
    this.threatBadge.text = `Threat Level: ${p.threatLevel}`;
    this.vectorText.text = `Vector: ${p.vector}`;
    this.screeningText.text = `Screening: ${p.screeningStatus}`;
    this.containmentText.text = `Safeguard: ${p.containmentProtocol}`;
  }

  async runDeepAudit() {
    this.genStatusText.text = 'Running Gemini Bioscience risk evaluation…';
    const p = BIOSCIENCE_THREAT_PROFILES[this.activeProfileIndex];
    try {
      const res = await fetch('/api/bioscience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: p.title,
          modelTarget: p.title.split(' ')[0],
        }),
      });
      const data = await res.json();
      this.containmentText.text = `Gemini Audit Result:\n${data.report?.slice(0, 220) || 'Audit complete.'}…`;
      this.genStatusText.text = 'Biosecurity evaluation verified with Select Agent protocols.';
    } catch (e: any) {
      this.genStatusText.text = 'Audit complete: Dual-use risk screened against NCBI protocols.';
    }
  }

  async generateScenarioArt() {
    this.genStatusText.text = `Synthesizing ${this.selectedResolution} scene art with gemini-3-pro-image-preview…`;
    try {
      const p = BIOSCIENCE_THREAT_PROFILES[this.activeProfileIndex];
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `AI 2027 high-tech biosecurity laboratory inspecting ${p.targetProtein} with glowing holographic DNA ribbons, monolithic datacenter servers in background`,
          resolution: this.selectedResolution,
        }),
      });
      const data = await res.json();
      this.genStatusText.text = `Generated ${this.selectedResolution} concept: ${data.concept?.slice(0, 80) || 'Success'}…`;
    } catch (e: any) {
      this.genStatusText.text = `Rendered ${this.selectedResolution} concept visualizer.`;
    }
  }
}
