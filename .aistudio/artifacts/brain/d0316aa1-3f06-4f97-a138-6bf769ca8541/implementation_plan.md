# Plano de Implementação: Desobstrução Visual dos Modelos 3D & Dossiê Executivo Profissional

Reorganização ergonômica da disposição espacial dos painéis para desobstruir totalmente os modelos 3D centrais da cena, combinada com a entrega de um dossiê executivo profissional humanizado para clientes e investidores do projeto **IA 2027: Superhuman Intelligence XR**.

---

## Decisões Confirmadas pelo Usuário

> [!IMPORTANT]
> Com base nas escolhas confirmadas na Fase 1:
> - **Elemento Desobstruído**: Os modelos 3D centrais (DNA / Bio-estrutura, Rede Neural Neuralese com 350+ agentes em órbita, e Globo Geopolítico Tianwan/EUA) estavam cobertos pelo empilhamento vertical do painel de telemetria, histórico e cartões.
> - **Nova Disposição Espacial**: Afastamento dos painéis para as laterais em formato de arco panorâmico ergonômico, elevação do painel de telemetria para o dossel superior e rebaixamento do console inferior como um pedestal de controle inclinado.
> - **Formato da Documentação**: **Dossiê Executivo Completo com Manual de Operação e Arquitetura Técnica**, escrito em tom humanizado, polido e pronto para apresentações comerciais com clientes de alto nível.

---

## 1. Visão Geral & Conceito

- **O que resolve**: Corrige o congestionamento visual da cena em que o painel de telemetria (`y: 1.95`) e o gráfico histórico (`y: 2.48`) colidiam com a visão frontal do palco 3D (`y: 1.45`), permitindo que clientes e usuários desfrutem da contemplação dos modelos 3D com profundidade espacial real.
- **Dossiê para o Cliente**: Entrega um documento de classe corporativa (`DOCUMENTACAO_CLIENTE_IA2027.md`) traduzindo conceitos complexos de inteligência sobre-humana, segurança biológica, chips e computação em narrativa acessível, estratégica e convincente.

---

## 2. Nova Arquitetura Espacial e Design Visual

### Diagrama de Layout Espacial (Visão Frontal e Perfil)

```
                     [ Dossiê Superior / Teto ]
           ┌──────────────────────────────────────────────┐
           │   TelemetryPanel (y: 2.22m, rotX: 0.35 rad)  │
           │   * Gráfico 60s expansível / recolhível      │
           └──────────────────────────────────────────────┘
                                  ▲
                         (Linha de Visão Limpa)
                                  ▼
┌──────────────────┐    ┌────────────────────┐    ┌──────────────────┐
│   TimelineCard   │    │   PALCO 3D CENTRAL │    │   ChatbotCard    │
│  (Ala Esquerda)  │    │  (Bio / Neural /   │    │  (Ala Direita)   │
│  x: -1.05m       │    │   Globo 3D)        │    │  x: +1.05m       │
│  z: -1.25m       │    │  x: 0, y: 1.38m    │    │  z: -1.25m       │
│  rotY: +0.38 rad │    │  z: -1.45m         │    │  rotY: -0.38 rad │
└──────────────────┘    └────────────────────┘    └──────────────────┘
                                  ▲
                         (Linha de Visão Limpa)
                                  ▼
           ┌──────────────────────────────────────────────┐
           │   BioscienceCard (Console Pedestal Inferior) │
           │   y: 0.48m, z: -1.18m, rotX: -0.38 rad       │
           └──────────────────────────────────────────────┘
```

### Principais Mudanças Espaciais:
1. **Palco 3D Central Desimpedido (`x: 0, y: 1.38, z: -1.45`)**:
   - Espaço vertical de 1.0 metro totalmente livre entre o console inferior e a telemetria superior.
   - Os modelos 3D giram com amplitude visual completa e iluminação com realce ciano/magenta.
2. **Asas Laterais Panorâmicas em Arco**:
   - `TimelineCard`: Afastado de `x: -0.76` para `x: -1.05`, angulado a 22° para dentro.
   - `ChatbotCard`: Afastado de `x: +0.76` para `x: +1.05`, angulado a -22° para dentro.
3. **Console Pedestal Inferior**:
   - `BioscienceCard`: Rebaixado de `y: 0.65` para `y: 0.48`, inclinado a 22° para cima como uma mesa de comando tátil.
4. **Modo Foco / Zen (Botão de Visualização Limpa)**:
   - Adição de um botão de ação rápida no cabeçalho ou palco que recolhe os painéis para uma experiência 100% cinematográfica do palco 3D.

---

## 3. Estrutura do Dossiê Executivo Humanizado

Criação do arquivo `DOCUMENTACAO_CLIENTE_IA2027.md` estruturado com linguagem executiva clara, empática e impactante:

1. **Manifesto Executivo**: A relevância da transição de IA atual até 2027 e o propósito do Observatório XR.
2. **Navegação Intuitiva do Usuário**:
   - Como interagir em headsets XR (gesto de pinça, apontamento a laser, rotação espacial).
   - Como usar no simulador desktop (mouse, cliques, modo câmera).
3. **Detalhamento dos Recursos Principais**:
   - *Linha do Tempo 2025-2027*: Marcos de computação, agentes autônomos e dilemas geopolíticos.
   - *Assistente Cognitivo Gemini com Papéis*: Visões de Segurança, Agente-4 e Diretor de Defesa.
   - *Estúdio de Biossegurança*: Triagem de ameaças biológicas e geração de arte conceitual em 1K/2K/4K.
   - *Telemetria de Computo em Tempo Real*: Monitoramento de FLOPs, PUE, temperatura neural e histórico 60s.
4. **Arquitetura de Engenharia & Confiabilidade**:
   - Pilha técnica WebXR + Three.js + XR Blocks + Vite Proxy.
   - Segurança de chaves de API e isolamento no backend.
5. **Roteiro de Demonstração para Clientes (Sales Pitch Script)**:
   - Passo a passo de 5 minutos para apresentar o produto a diretores e investidores.

---

## 4. Etapas de Execução

1. **Reorganização das Coordenadas Espaciais (`src/index.ts`)**:
   - Atualizar posições e rotações de `stageGroup`, `timelineCard`, `chatbotCard`, `bioscienceCard`, `telemetryPanel` e `historyChart`.
   - Adicionar modo de visualização livre / foco.
2. **Otimização do TelemetryPanel e HistoryChart (`src/ui/TelemetryPanel.ts`, `src/ui/TelemetryHistoryChart.ts`)**:
   - Ajustar dimensões para integração limpa no dossel superior.
   - Alternância fluida do gráfico 60s sem poluir a visão central.
3. **Geração do Dossiê Profissional (`DOCUMENTACAO_CLIENTE_IA2027.md`)**:
   - Redigir documentação humanizada completa em português impecável.
4. **Validação & Testes**:
   - Executar `lint_applet` e `compile_applet`.
   - Verificar carregamento e estabilidade do servidor de desenvolvimento.
