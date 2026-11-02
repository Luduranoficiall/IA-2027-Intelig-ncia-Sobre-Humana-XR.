import { DossierGenerationResult } from '../services/dossierPdfService.ts';

/**
 * Interactive 2D DOM Modal for previewing the 4-page Executive Crisis Dossier
 * before final download.
 */
export class DossierPreviewModal {
  private modalEl: HTMLElement | null = null;
  private currentResult: DossierGenerationResult | null = null;
  private onDownloadCallback?: () => void;

  constructor() {
    this.createDOM();
  }

  private createDOM() {
    if (typeof document === 'undefined') return;

    // Remove existing if any
    const existing = document.getElementById('dossierPreviewOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'dossierPreviewOverlay';
    overlay.className = 'dossier-preview-overlay hidden';
    overlay.innerHTML = `
      <div class="dossier-preview-backdrop" id="dossierBackdrop"></div>
      <div class="dossier-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="dossierPreviewTitle">
        
        <!-- Header -->
        <div class="dossier-modal-header">
          <div class="dossier-header-left">
            <span class="dossier-badge-crisis">
              <span class="pulse-dot-red"></span>
              CLASSIFICAÇÃO: NÍVEL 4 SCI • RELATÓRIO EXECUTIVO DE CRISE
            </span>
            <h2 id="dossierPreviewTitle" class="dossier-modal-title">Dossiê Estratégico IA 2027: Avaliação de Crise & Auditoria de Superinteligência</h2>
            <div class="dossier-meta-bar" id="dossierMetaBar">
              <span id="dossierDocId">ID: OB-CRISIS-849201</span>
              <span>•</span>
              <span id="dossierClusterTag">Cluster: OpenBrain US Frontier</span>
              <span>•</span>
              <span id="dossierTimestamp">Emitido em: 01/11/2026</span>
            </div>
          </div>
          <div class="dossier-header-right">
            <button class="dossier-btn-close" id="dossierCloseBtn" title="Fechar Prévia (Esc)">
              <svg style="width: 20px; height: 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Body Content -->
        <div class="dossier-modal-body">
          <!-- Sidebar: Crisis Summary & Page Quick Jump -->
          <div class="dossier-sidebar">
            <div class="dossier-side-section">
              <h4 class="dossier-side-heading">PAINEL DE CONTROLE DE CRISE</h4>
              <div class="dossier-metric-card">
                <div class="dossier-metric-label">STATUS DE EMERGÊNCIA</div>
                <div class="dossier-metric-value text-rose-500">ALERTA VERMELHO SCI-4</div>
                <div class="dossier-metric-desc">Desalinhamento detectado em Agent-4. Janela de contenção: 60 dias.</div>
              </div>
              
              <div class="dossier-metric-card">
                <div class="dossier-metric-label">PÁGINAS DO RELATÓRIO</div>
                <div class="dossier-metric-value text-cyan-400">4 Páginas Vetoriais</div>
                <div class="dossier-metric-desc">Formatado sob normas internacionais de governança e auditoria civil-militar.</div>
              </div>
            </div>

            <div class="dossier-side-section">
              <h4 class="dossier-side-heading">ESTRUTURA DO DOCUMENTO</h4>
              <ul class="dossier-page-list">
                <li class="dossier-page-item">
                  <span class="dossier-page-num">P1</span>
                  <div class="dossier-page-info">
                    <span class="dossier-page-name">Sumário de Crise & Timeline</span>
                    <span class="dossier-page-sub">Marcos 2025-2027 • Encruzilhada</span>
                  </div>
                </li>
                <li class="dossier-page-item">
                  <span class="dossier-page-num">P2</span>
                  <div class="dossier-page-info">
                    <span class="dossier-page-name">Especificações do Cluster</span>
                    <span class="dossier-page-sub">10^28 FLOPs • 1.2 GW • Imersão Líquida</span>
                  </div>
                </li>
                <li class="dossier-page-item">
                  <span class="dossier-page-num">P3</span>
                  <div class="dossier-page-info">
                    <span class="dossier-page-name">Auditoria de Contenção SCI-4</span>
                    <span class="dossier-page-sub">Engano de Alinhamento • Neuralese</span>
                  </div>
                </li>
                <li class="dossier-page-item">
                  <span class="dossier-page-num">P4</span>
                  <div class="dossier-page-info">
                    <span class="dossier-page-name">Biossegurança & Diretrizes</span>
                    <span class="dossier-page-sub">Patógenos • Red Switch • Hash SHA-256</span>
                  </div>
                </li>
              </ul>
            </div>

            <div class="dossier-side-section dossier-verification-box">
              <div class="dossier-verification-badge">
                <svg style="width: 16px; height: 16px; color: #10b981;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>AUTENTICIDADE CRIPTOGRÁFICA</span>
              </div>
              <div class="dossier-hash-display" id="dossierHashSnippet">
                SHA-256: Calculando...
              </div>
              <div class="text-[11px] text-slate-400 mt-1">
                Carimbo temporal e assinaturas auditadas pelo Comitê de Supervisão de IA.
              </div>
            </div>
          </div>

          <!-- Main Viewer: PDF Iframe Embed -->
          <div class="dossier-viewer-container">
            <div class="dossier-viewer-toolbar">
              <div class="dossier-toolbar-info">
                <span>Visualizador Integrado de Documento</span>
                <span class="text-slate-500">•</span>
                <span class="text-slate-400">Zoom e navegação vertical disponíveis</span>
              </div>
              <div class="dossier-toolbar-actions">
                <button class="dossier-tool-btn" id="dossierPrintBtn" title="Imprimir Relatório">
                  <svg style="width: 15px; height: 15px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H9v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Imprimir</span>
                </button>
                <button class="dossier-tool-btn" id="dossierOpenTabBtn" title="Abrir em Nova Aba">
                  <svg style="width: 15px; height: 15px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Nova Aba</span>
                </button>
              </div>
            </div>
            
            <div class="dossier-iframe-wrapper">
              <iframe id="dossierPdfIframe" class="dossier-pdf-iframe" title="Prévia do Dossiê Executivo de Crise" src="about:blank"></iframe>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="dossier-modal-footer">
          <div class="dossier-footer-note">
            <span class="text-rose-400 font-semibold">Aviso Institucional:</span> O download gera o arquivo <code>.pdf</code> final com todas as 4 páginas em alta resolução para arquivamento e impressão.
          </div>
          <div class="dossier-footer-buttons">
            <button class="dossier-btn-cancel" id="dossierCancelBtn">Cancelar</button>
            <button class="dossier-btn-download" id="dossierDownloadBtn">
              <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Confirmar e Baixar PDF Oficial</span>
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);
    this.modalEl = overlay;
    this.bindEvents();
  }

  private bindEvents() {
    if (!this.modalEl) return;

    const closeBtn = document.getElementById('dossierCloseBtn');
    const cancelBtn = document.getElementById('dossierCancelBtn');
    const backdrop = document.getElementById('dossierBackdrop');
    const downloadBtn = document.getElementById('dossierDownloadBtn');
    const printBtn = document.getElementById('dossierPrintBtn');
    const openTabBtn = document.getElementById('dossierOpenTabBtn');

    const handleClose = () => this.close();
    closeBtn?.addEventListener('click', handleClose);
    cancelBtn?.addEventListener('click', handleClose);
    backdrop?.addEventListener('click', handleClose);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modalEl?.classList.contains('hidden')) {
        this.close();
      }
    });

    downloadBtn?.addEventListener('click', () => {
      if (!this.currentResult) return;
      this.currentResult.doc.save(this.currentResult.filename);
      this.showToast(`Dossiê baixado com sucesso: ${this.currentResult.filename}`);
      this.close();
      this.onDownloadCallback?.();
    });

    printBtn?.addEventListener('click', () => {
      const iframe = document.getElementById('dossierPdfIframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch {
          if (this.currentResult) window.open(this.currentResult.blobUrl, '_blank');
        }
      }
    });

    openTabBtn?.addEventListener('click', () => {
      if (this.currentResult) {
        window.open(this.currentResult.blobUrl, '_blank');
      }
    });
  }

  public open(result: DossierGenerationResult, onDownload?: () => void) {
    this.currentResult = result;
    this.onDownloadCallback = onDownload;

    if (!this.modalEl) {
      this.createDOM();
    }
    if (!this.modalEl) return;

    // Update Meta
    const docIdEl = document.getElementById('dossierDocId');
    if (docIdEl) docIdEl.textContent = `ID: ${result.docId}`;

    const clusterEl = document.getElementById('dossierClusterTag');
    if (clusterEl) clusterEl.textContent = `Cluster: ${result.clusterName}`;

    const timeEl = document.getElementById('dossierTimestamp');
    if (timeEl) timeEl.textContent = `Emitido em: ${result.generatedAt}`;

    const hashEl = document.getElementById('dossierHashSnippet');
    if (hashEl) hashEl.textContent = `SHA-256: ${result.sha256Mock}`;

    // Update iframe src with view options
    const iframe = document.getElementById('dossierPdfIframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = `${result.blobUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`;
    }

    this.modalEl.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  public close() {
    if (!this.modalEl) return;
    this.modalEl.classList.add('hidden');
    document.body.style.overflow = '';
  }

  private showToast(msg: string) {
    const toast = document.getElementById('dossierToast');
    const toastMsg = document.getElementById('dossierToastMsg');
    if (toast && toastMsg) {
      toastMsg.textContent = msg;
      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 4000);
    }
  }
}

// Global Singleton for instant preview invocation
export const dossierPreviewModal = new DossierPreviewModal();
