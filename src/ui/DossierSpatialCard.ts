import * as THREE from 'three';
import * as xb from 'xrblocks';
import { DossierGenerationResult } from '../services/dossierPdfService.ts';
import { hapticsService } from '../services/hapticsService.ts';

export interface DossierSpatialCardCallbacks {
  onDownload: () => void;
  onOpen2DPreview: () => void;
  onClose: () => void;
}

/**
 * 3D Spatial UI Card displaying executive dossier summary and actions
 * directly within the WebXR scene.
 */
export class DossierSpatialCard extends xb.UICard {
  private titleText: xb.UIText;
  private statusText: xb.UIText;
  private hashText: xb.UIText;
  private currentResult?: DossierGenerationResult;

  constructor(callbacks: DossierSpatialCardCallbacks) {
    const cardSize = { width: 0.88, height: 0.44 };

    // Header badge
    const badge = new xb.UIText({
      text: '● NÍVEL 4 SCI • RELATÓRIO EXECUTIVO DE CRISE',
      style: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#f43f5e',
        backgroundColor: '#881337',
        padding: 4,
        paddingLeft: 8,
        paddingRight: 8,
        borderRadius: 6,
      },
    });

    const closeBtn = new xb.UIButton({
      icon: 'close',
      label: 'Fechar',
      style: { height: 28, fontSize: 11, paddingLeft: 8, paddingRight: 8 },
      onClick: () => {
        hapticsService.pulseClick();
        callbacks.onClose();
      },
    });

    const header = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      children: [badge, closeBtn],
    });

    // Title
    const titleText = new xb.UIText({
      text: 'DOSSIÊ EXECUTIVO DE CRISE IA 2027',
      style: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
    });

    const subText = new xb.UIText({
      text: 'Auditoria de Transição para Superinteligência, Mega-Clusters e Biossegurança',
      style: { fontSize: 12, color: '#94a3b8' },
    });

    // Info Grid
    const statusText = new xb.UIText({
      text: '4 Páginas Formatadas • Pronto para Emissão Oficial',
      style: { fontSize: 13, fontWeight: 'bold', color: '#38bdf8' },
    });

    const hashText = new xb.UIText({
      text: 'Hash Criptográfico: SHA-256 Validado',
      style: { fontSize: 11, color: '#64748b' },
    });

    const summaryBox = new xb.UIPanel({
      style: {
        width: '100%',
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#0f172a',
        flexDirection: 'column',
        gap: 6,
      },
      children: [statusText, hashText],
    });

    // Action Buttons
    const downloadBtn = new xb.UIButton({
      icon: 'download',
      label: 'Baixar PDF Oficial',
      style: {
        flexGrow: 1,
        height: 38,
        fontSize: 13,
        fontWeight: 'bold',
        backgroundColor: '#0284c7',
        color: '#ffffff',
      },
      onClick: () => {
        hapticsService.pulseDossierExport();
        callbacks.onDownload();
      },
    });

    const preview2DBtn = new xb.UIButton({
      icon: 'preview',
      label: 'Ver Prévia Completa',
      style: {
        flexGrow: 1,
        height: 38,
        fontSize: 13,
        backgroundColor: '#1e293b',
        color: '#e2e8f0',
      },
      onClick: () => {
        hapticsService.pulseClick();
        callbacks.onOpen2DPreview();
      },
    });

    const actions = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        marginTop: 6,
      },
      children: [downloadBtn, preview2DBtn],
    });

    super({
      size: cardSize,
      manipulation: true,
      edge: true,
      style: {
        flexDirection: 'column',
        gap: 12,
        padding: 18,
        backgroundColor: '#020617ee',
        borderRadius: 16,
      },
      children: [header, titleText, subText, summaryBox, actions],
    });

    this.titleText = titleText;
    this.statusText = statusText;
    this.hashText = hashText;
    this.visible = false;
  }

  public show(result: DossierGenerationResult) {
    this.currentResult = result;
    this.statusText.text = `ID: ${result.docId} • ${result.clusterName} (4 Páginas)`;
    this.hashText.text = `SHA-256: ${result.sha256Mock.slice(0, 32)}... • ${result.generatedAt}`;
    this.visible = true;
  }

  public hide() {
    this.visible = false;
  }
}
