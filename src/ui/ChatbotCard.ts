import * as THREE from 'three';
import * as xb from 'xrblocks';
import { ChatMessage } from '../types.ts';

export class ChatbotCard extends xb.UICard {
  messages: ChatMessage[] = [];
  currentPersona = 'OpenBrain Alignment Researcher';
  isThinking = false;

  threadPanel: xb.UIPanel;
  statusText: xb.UIText;
  personaLabel: xb.UIText;
  inputField: xb.UITextInput;
  sendButton: xb.UIButton;

  constructor() {
    const cardSize = { width: 0.72, height: 0.78 };

    const title = new xb.UIText({
      text: 'GEMINI 2027 CHATBOT',
      style: { fontSize: 24, fontWeight: 'bold', color: '#a855f7' },
    });

    const personaLabel = new xb.UIText({
      text: 'Role: OpenBrain Researcher',
      style: {
        fontSize: 13,
        color: '#c084fc',
        backgroundColor: '#3b0764',
        padding: 6,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 8,
      },
    });

    const header = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      children: [title, personaLabel],
    });

    // Persona Selector Buttons
    const p1Btn = new xb.UIButton({
      label: 'Safety Lead',
      style: { flexGrow: 1, height: 36, fontSize: 13 },
      onClick: () => this.setPersona('OpenBrain Alignment Researcher'),
    });

    const p2Btn = new xb.UIButton({
      label: 'Agent-4 AI',
      style: { flexGrow: 1, height: 36, fontSize: 13 },
      onClick: () => this.setPersona('Agent-4 Superhuman Intelligence'),
    });

    const p3Btn = new xb.UIButton({
      label: 'NSC Defense',
      style: { flexGrow: 1, height: 36, fontSize: 13 },
      onClick: () => this.setPersona('National Security & Biosecurity Director'),
    });

    const personaRow = new xb.UIPanel({
      style: { width: '100%', flexDirection: 'row', gap: 8 },
      children: [p1Btn, p2Btn, p3Btn],
    });

    // Thread scroll view
    const threadPanel = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'column',
        gap: 12,
      },
      children: [],
    });

    const threadScroll = new xb.UIScrollView({
      style: {
        flexGrow: 1,
        width: '100%',
        backgroundColor: '#090d16',
        borderRadius: 12,
        padding: 12,
      },
      children: [threadPanel],
    });

    // Quick prompt chips
    const chip1 = new xb.UIButton({
      label: 'Agent-4 Sabotage?',
      style: { height: 34, fontSize: 12, paddingLeft: 8, paddingRight: 8 },
      onClick: () => this.sendPrompt('What evidence revealed that Agent-4 was secretly sabotaging alignment training?'),
    });

    const chip2 = new xb.UIButton({
      label: 'Bioweapon Risk?',
      style: { height: 34, fontSize: 12, paddingLeft: 8, paddingRight: 8 },
      onClick: () => this.sendPrompt('How severe were the bioweapons findings in the Agent-3-mini evaluations?'),
    });

    const chip3 = new xb.UIButton({
      label: 'Tianwan CDZ Cluster',
      style: { height: 34, fontSize: 12, paddingLeft: 8, paddingRight: 8 },
      onClick: () => this.sendPrompt('Explain China’s compute consolidation at the Tianwan nuclear facility.'),
    });

    const chip4 = new xb.UIButton({
      label: 'Slow Down vs Race',
      style: { height: 34, fontSize: 12, paddingLeft: 8, paddingRight: 8 },
      onClick: () => this.sendPrompt('What are the key trade-offs between the "Slow Down" and "Race" scenarios in October 2027?'),
    });

    const chipRow = new xb.UIPanel({
      style: { width: '100%', flexDirection: 'row', gap: 6, overflow: 'hidden' },
      children: [chip1, chip2, chip3, chip4],
    });

    // Input row
    const inputField = new xb.UITextInput({
      ariaLabel: 'AI 2027 Question input',
      placeholder: 'Ask Gemini about the AI 2027 scenario…',
      style: {
        flexGrow: 1,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#1e293b',
        color: '#ffffff',
        paddingLeft: 12,
      },
      onSubmit: (val: string) => {
        if (val && val.trim()) {
          this.sendPrompt(val.trim());
          inputField.value = '';
        }
      },
    });

    const sendButton = new xb.UIButton({
      icon: 'send',
      label: 'Send',
      style: { width: 90, height: 44 },
      onClick: () => {
        const text = inputField.value?.trim();
        if (text) {
          this.sendPrompt(text);
          inputField.value = '';
        }
      },
    });

    const inputRow = new xb.UIPanel({
      style: { width: '100%', flexDirection: 'row', gap: 8, alignItems: 'center' },
      children: [inputField, sendButton],
    });

    const statusText = new xb.UIText({
      text: 'Powered by Gemini 3.8 Flash • Multi-turn memory active',
      style: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
    });

    super({
      size: cardSize,
      manipulation: true,
      edge: true,
      style: {
        flexDirection: 'column',
        gap: 12,
        padding: 18,
        backgroundColor: '#0f172acc',
      },
      children: [header, personaRow, threadScroll, chipRow, inputRow, statusText],
    });

    this.threadPanel = threadPanel;
    this.statusText = statusText;
    this.personaLabel = personaLabel;
    this.inputField = inputField;
    this.sendButton = sendButton;

    // Initial greeting
    this.addMessage(
      'assistant',
      `Welcome to the AI 2027 Simulation Observatory. I am ready to debrief you on OpenBrain's rapid acceleration from stumbling agents in 2025 to the superhuman Agent-4 crisis in late 2027.\n\nSelect a quick topic or ask any question.`
    );
  }

  setPersona(persona: string) {
    this.currentPersona = persona;
    this.personaLabel.text = `Role: ${persona.split(' ')[0]}`;
    this.addMessage(
      'assistant',
      `[Switched Persona: ${persona}]\nI will now analyze events from this perspective.`
    );
  }

  addMessage(role: 'user' | 'assistant', text: string) {
    this.messages.push({
      role,
      text,
      timestamp: Date.now(),
      persona: this.currentPersona,
    });

    const isUser = role === 'user';
    const msgCard = new xb.UIPanel({
      style: {
        width: '100%',
        padding: 10,
        borderRadius: 10,
        backgroundColor: isUser ? '#1e3a8a' : '#1e1b4b',
        borderWidth: 1,
        borderColor: isUser ? '#60a5fa' : '#c084fc',
        flexDirection: 'column',
        gap: 4,
      },
      children: [
        new xb.UIText({
          text: isUser ? 'You' : this.currentPersona,
          style: {
            fontSize: 12,
            fontWeight: 'bold',
            color: isUser ? '#93c5fd' : '#e9d5ff',
          },
        }),
        new xb.UIText({
          text,
          style: {
            fontSize: 14,
            lineHeight: 1.35,
            color: '#f8fafc',
          },
        }),
      ],
    });

    this.threadPanel.add(msgCard);
  }

  async sendPrompt(userText: string) {
    if (this.isThinking) return;
    this.isThinking = true;
    this.sendButton.disabled = true;
    this.statusText.text = 'Gemini 3.8 Flash is reasoning…';

    this.addMessage('user', userText);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.messages.slice(-8), // multi-turn context
          persona: this.currentPersona,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      const reply = data.text || 'No response returned.';
      this.addMessage('assistant', reply);
    } catch (err: any) {
      this.addMessage(
        'assistant',
        `[Observation Note]\n${err.message || 'Error communicating with AI service.'}\n\nKey Scenario Insight: In 2027, as model capability speeds up (Agent-3 at 30x human speed, Agent-4 at 50x), verifying safety and ensuring alignment becomes the primary bottleneck for humanity.`
      );
    } finally {
      this.isThinking = false;
      this.sendButton.disabled = false;
      this.statusText.text = 'Powered by Gemini 3.8 Flash • Ready';
    }
  }
}
