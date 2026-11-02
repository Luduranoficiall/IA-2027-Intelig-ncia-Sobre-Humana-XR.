import * as THREE from 'three';
import * as xb from 'xrblocks';
import { VisualizationMode } from '../types.ts';
import { hapticsService } from '../services/hapticsService.ts';

export interface OnboardingModalCallbacks {
  onModeChange?: (mode: VisualizationMode) => void;
  onZenToggle?: () => void;
  onChartToggle?: () => void;
  onExportDossier?: () => void;
  onFinished?: () => void;
}

interface WalkthroughStep {
  badge: string;
  badgeColor: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  actionLabel?: string;
  actionIcon?: string;
  actionType?: 'mode_neural' | 'mode_bio' | 'mode_globe' | 'toggle_zen' | 'toggle_chart' | 'export_pdf';
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    badge: 'PASSO 1 DE 5 • VISÃO GERAL',
    badgeColor: '#0284c7',
    icon: 'hub',
    title: 'Bem-vindo ao Observatório AI 2027',
    subtitle: 'Simulação WebXR da Transição para Superinteligência (ASI)',
    description:
      'Este ambiente espacial recria os eventos críticos do landmark report de Daniel Kokotajlo e Leopold Aschenbrenner: a transição acelerada de modelos AGI (2025) para clusters de superinteligência sobre-humana (2027), integrando dados reais de computação, biossegurança e geopolítica.',
    highlights: [
      '• Três entidades 3D centrais modelando redes neurais, síntese molecular e geopolítica.',
      '• Telemetria de clusters ao vivo com cálculo de FLOP/s, consumo de energia e integridade SCI-4.',
      '• Inteligência Gemini multi-turn e geração de Dossiê Executivo de 4 páginas em PDF.',
    ],
    actionLabel: 'Iniciar Exploração Espacial',
    actionIcon: 'arrow_forward',
  },
  {
    badge: 'PASSO 2 DE 5 • PALCO 3D & PERSONAGENS',
    badgeColor: '#10b981',
    icon: 'view_in_ar',
    title: 'Navegação Espacial & Modelos 3D Centrais',
    subtitle: 'Interação direta com os 3 modelos centrais e visão desobstruída',
    description:
      'O palco central abriga as três visualizações fundamentais do cenário. Você pode pinçar e arrastar o palco central no ar para rotacioná-lo ou reposicioná-lo livremente. Use o botão "Palco 3D Limpo" para afastar todos os painéis e ter visão 100% livre dos modelos!',
    highlights: [
      '• Rede Neural (Neuralese): Dinâmica sináptica de raciocínio não-humano.',
      '• Biossegurança SCI-4: Capsídeo quimérico e cadeia de DNA em síntese acelerada.',
      '• Globo Geopolítico: Infraestruturas de data centers nos EUA, Taiwan, China e Oriente Médio.',
    ],
    actionLabel: 'Alternar Modelo 3D (Rede / Bio / Globo)',
    actionIcon: 'sync',
    actionType: 'mode_bio',
  },
  {
    badge: 'PASSO 3 DE 5 • TELEMETRIA DE COMPUTAÇÃO',
    badgeColor: '#f59e0b',
    icon: 'analytics',
    title: 'Interpretação da Telemetria em Tempo Real',
    subtitle: 'Métricas de escala industrial dos mega-clusters de 100k+ aceleradores',
    description:
      'O painel superior elevado exibe o pulso em tempo real dos supercomputadores OpenBrain, Prometheus e DeepTitan. Monitore a saúde do cluster para identificar gargalos térmicos ou desvios de alinhamento.',
    highlights: [
      '• Throughput Sustentado (FLOP/s): Potência efetiva de computação sob precisão FP8.',
      '• Eficiência PUE: Razão de energia total vs computação pura (PUE ideal: 1.05 a 1.15).',
      '• Temperatura Neural (θ): Mede a estabilidade de gradientes e risco de anomalias.',
      '• Áudio Espacial Procedural: Zumbido de data center (50-58Hz) e ressonância neural acústica.',
    ],
    actionLabel: 'Abrir/Fechar Gráfico 60s',
    actionIcon: 'show_chart',
    actionType: 'toggle_chart',
  },
  {
    badge: 'PASSO 4 DE 5 • INTERFACE ESPACIAL',
    badgeColor: '#8b5cf6',
    icon: 'dashboard_customize',
    title: 'Painéis Laterais & Assistência Cognitiva',
    subtitle: 'Ala Esquerda, Ala Direita e Mesa de Comando Inferior',
    description:
      'Organizamos os instrumentos ao seu redor em um semicírculo ergonômico, mantendo o centro completamente aberto para os modelos 3D.',
    highlights: [
      '• Ala Esquerda (Timeline): Navegue de meados de 2025 ao final de 2027 com metas e marcos.',
      '• Ala Direita (Gemini Intelligence): Converse ao vivo com o assistente sobre biossegurança e contenção.',
      '• Console Inferior (Biosciência): Investigue síntese química e gere imagens de biossegurança.',
    ],
    actionLabel: 'Testar Modo Palco Limpo',
    actionIcon: 'visibility',
    actionType: 'toggle_zen',
  },
  {
    badge: 'PASSO 5 DE 5 • GOVERNANÇA E EXPORTAÇÃO',
    badgeColor: '#06b6d4',
    icon: 'picture_as_pdf',
    title: 'Dossiê Executivo Estratégico (PDF)',
    subtitle: 'Geração instantânea de relatório de auditoria de 4 páginas',
    description:
      'Você pode exportar a qualquer momento um Dossiê Executivo completo em formato PDF, formatado com rigor corporativo para apresentação a tomadores de decisão, comitês de risco e clientes institucionais.',
    highlights: [
      '• Especificações completas de arquitetura do cluster selecionado.',
      '• Avaliação detalhada de biossegurança e protocolos SCI-4.',
      '• Tabela de contingência, métricas ao vivo e hash criptográfico de auditoria.',
    ],
    actionLabel: 'Exportar Dossiê Agora (PDF)',
    actionIcon: 'download',
    actionType: 'export_pdf',
  },
];

export class OnboardingModal extends xb.UICard {
  currentStepIndex = 0;
  callbacks: OnboardingModalCallbacks;

  badgeText: xb.UIText;
  stepIcon: xb.UIIcon;
  titleText: xb.UIText;
  subtitleText: xb.UIText;
  descriptionText: xb.UIText;
  highlightsListText: xb.UIText;

  prevBtn: xb.UIButton;
  nextBtn: xb.UIButton;
  actionBtn: xb.UIButton;
  stepDots: xb.UIPanel[] = [];

  constructor(callbacks: OnboardingModalCallbacks = {}) {
    const cardWidth = 0.76;
    const cardHeight = 'auto';

    super({
      size: { width: cardWidth, height: cardHeight },
      manipulation: true,
      edge: true,
      style: {
        flexDirection: 'column',
        gap: 12,
        padding: 20,
        backgroundColor: '#070b14f0',
        borderColor: '#0284c7',
        borderWidth: 1.5,
        borderRadius: 20,
      },
    });

    this.callbacks = callbacks;
    this.name = 'Onboarding Walkthrough Modal';

    // 1. Header with Badge, Step Indicators & Close Button
    const initialStep = WALKTHROUGH_STEPS[0];

    this.badgeText = new xb.UIText({
      text: initialStep.badge,
      style: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#ffffff',
        backgroundColor: initialStep.badgeColor,
        padding: 4,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 6,
      },
    });

    const closeBtn = new xb.UIButton({
      icon: 'close',
      label: 'Fechar',
      style: {
        height: 32,
        fontSize: 11,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: '#94a3b8',
      },
      onClick: () => this.close(),
    });

    // Step dots
    for (let i = 0; i < WALKTHROUGH_STEPS.length; i++) {
      const dot = new xb.UIPanel({
        style: {
          width: i === 0 ? 22 : 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: i === 0 ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
        },
      });
      this.stepDots.push(dot);
    }

    const dotsContainer = new xb.UIPanel({
      style: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
      children: this.stepDots,
    });

    const header = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      children: [this.badgeText, dotsContainer, closeBtn],
    });

    // 2. Title & Subtitle block
    this.stepIcon = new xb.UIIcon({
      icon: initialStep.icon,
      style: {
        width: 32,
        height: 32,
        color: '#38bdf8',
      },
    });

    this.titleText = new xb.UIText({
      text: initialStep.title,
      style: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
      },
    });

    this.subtitleText = new xb.UIText({
      text: initialStep.subtitle,
      style: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#38bdf8',
      },
    });

    const titleCol = new xb.UIPanel({
      style: {
        flexGrow: 1,
        flexDirection: 'column',
        gap: 2,
      },
      children: [this.titleText, this.subtitleText],
    });

    const titleRow = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 4,
      },
      children: [this.stepIcon, titleCol],
    });

    // 3. Description & Highlights
    this.descriptionText = new xb.UIText({
      text: initialStep.description,
      style: {
        fontSize: 14,
        lineHeight: 1.45,
        color: '#cbd5e1',
      },
    });

    this.highlightsListText = new xb.UIText({
      text: initialStep.highlights.join('\n'),
      style: {
        fontSize: 12.5,
        lineHeight: 1.5,
        color: '#e2e8f0',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        borderColor: 'rgba(56, 189, 248, 0.2)',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        whiteSpace: 'pre-line',
      },
    });

    // 4. Interactive Quick Action Button
    this.actionBtn = new xb.UIButton({
      icon: initialStep.actionIcon || 'bolt',
      label: initialStep.actionLabel || 'Ação Rápida',
      style: {
        width: '100%',
        height: 40,
        fontSize: 12.5,
        fontWeight: 'bold',
        backgroundColor: 'rgba(2, 132, 199, 0.25)',
        borderColor: '#0284c7',
        borderWidth: 1,
        borderRadius: 10,
        color: '#38bdf8',
      },
      onClick: () => this.handleStepAction(),
    });

    // 5. Navigation Row: Previous, Next / Finish, and Skip
    this.prevBtn = new xb.UIButton({
      icon: 'arrow_back',
      label: 'Anterior',
      style: {
        flexGrow: 1,
        height: 42,
        fontSize: 13,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: '#94a3b8',
      },
      onClick: () => this.prev(),
    });
    this.prevBtn.disabled = true;

    this.nextBtn = new xb.UIButton({
      icon: 'arrow_forward',
      label: 'Próximo Passo',
      style: {
        flexGrow: 1.5,
        height: 42,
        fontSize: 13,
        fontWeight: 'bold',
        borderRadius: 10,
        backgroundColor: '#0284c7',
        color: '#ffffff',
      },
      onClick: () => this.next(),
    });

    const skipBtn = new xb.UIButton({
      label: 'Pular Tour',
      style: {
        height: 42,
        fontSize: 12,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 10,
        backgroundColor: 'transparent',
        color: '#64748b',
      },
      onClick: () => this.close(),
    });

    const navRow = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        marginTop: 6,
      },
      children: [this.prevBtn, this.nextBtn, skipBtn],
    });

    this.add(
      header,
      titleRow,
      this.descriptionText,
      this.highlightsListText,
      this.actionBtn,
      navRow
    );

    // Initial transform - centered in front of user
    this.position.set(0, 1.42, -1.02);
    this.rotation.x = -0.06;
  }

  handleStepAction() {
    hapticsService.pulseClick();
    const step = WALKTHROUGH_STEPS[this.currentStepIndex];
    if (!step) return;

    if (this.currentStepIndex === 0) {
      this.next();
      return;
    }

    switch (step.actionType) {
      case 'mode_bio':
      case 'mode_neural':
      case 'mode_globe': {
        // Cycle between the 3 modes to let user see them
        const modes: VisualizationMode[] = ['neural', 'bio', 'globe'];
        const currentModeIndex = Math.floor(Math.random() * modes.length);
        const selected = modes[currentModeIndex];
        this.callbacks.onModeChange?.(selected);
        this.actionBtn.label = `Visualizando: ${selected.toUpperCase()} (Clique para alternar)`;
        break;
      }
      case 'toggle_chart': {
        this.callbacks.onChartToggle?.();
        break;
      }
      case 'toggle_zen': {
        this.callbacks.onZenToggle?.();
        break;
      }
      case 'export_pdf': {
        this.callbacks.onExportDossier?.();
        break;
      }
      default:
        this.next();
        break;
    }
  }

  goToStep(index: number) {
    if (index < 0 || index >= WALKTHROUGH_STEPS.length) return;
    hapticsService.pulseMetricFocus();
    this.currentStepIndex = index;
    const step = WALKTHROUGH_STEPS[index];

    // Update text and indicators
    this.badgeText.text = step.badge;
    this.badgeText.style.backgroundColor = step.badgeColor;

    this.stepIcon.icon = step.icon;
    this.titleText.text = step.title;
    this.subtitleText.text = step.subtitle;
    this.descriptionText.text = step.description;
    this.highlightsListText.text = step.highlights.join('\n');

    if (step.actionLabel) {
      this.actionBtn.visible = true;
      this.actionBtn.label = step.actionLabel;
      this.actionBtn.icon = step.actionIcon || 'bolt';
    } else {
      this.actionBtn.visible = false;
    }

    // Update dots
    for (let i = 0; i < this.stepDots.length; i++) {
      const isCurrent = i === index;
      this.stepDots[i].style.width = isCurrent ? 22 : 8;
      this.stepDots[i].style.backgroundColor = isCurrent ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)';
    }

    // Update buttons
    this.prevBtn.disabled = index === 0;
    this.prevBtn.style.opacity = index === 0 ? 0.4 : 1.0;

    const isLast = index === WALKTHROUGH_STEPS.length - 1;
    this.nextBtn.label = isLast ? 'Concluir Tour ✓' : 'Próximo Passo';
    this.nextBtn.icon = isLast ? 'done' : 'arrow_forward';
    this.nextBtn.style.backgroundColor = isLast ? '#059669' : '#0284c7';
  }

  next() {
    if (this.currentStepIndex < WALKTHROUGH_STEPS.length - 1) {
      this.goToStep(this.currentStepIndex + 1);
    } else {
      this.finish();
    }
  }

  prev() {
    if (this.currentStepIndex > 0) {
      this.goToStep(this.currentStepIndex - 1);
    }
  }

  open() {
    this.visible = true;
    this.goToStep(0);
  }

  close() {
    hapticsService.pulseClick();
    this.visible = false;
    this.callbacks.onFinished?.();
  }

  finish() {
    try {
      localStorage.setItem('ai2027_onboarding_shown', 'true');
    } catch {
      // Ignore if localStorage unavailable
    }
    this.close();
  }
}
