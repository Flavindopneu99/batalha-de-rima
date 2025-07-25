import { Character } from '../types';

const API_ENDPOINTS = {
  1: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  2: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
};

export class GeminiService {
  private getApiKey(apiNumber: 1 | 2): string {
    // Em produção, essas chaves viriam de variáveis de ambiente
    const keys = {
      1: import.meta.env.VITE_API_KEY_1 || 'AIzaSyCpn-KEpQ-e_CsOSoA8pzSgLfuIsv-IE8Q',
      2: import.meta.env.VITE_API_KEY_2 || 'AIzaSyDZ79VweSY9DpZHcOw8XzrtSj9v7KSoqbA'
    };
    return keys[apiNumber];
  }

  private buildConfigurationPrompt(character: Partial<Character>, question: string): string {
    return `Você é um assistente especializado em criar personagens para batalhas de rap/rima.

Contexto atual do personagem:
- Nome: ${character.name || 'Não definido'}
- Estilo: ${character.style || 'Não definido'}  
- Rival: ${character.rivalName || 'Não definido'}
- História do rival: ${character.rivalHistory || 'Não definida'}
- Motivo da rivalidade: ${character.rivalryReason || 'Não definido'}

Pergunta atual: ${question}

Responda de forma amigável e ajude o usuário a construir um personagem interessante para a batalha. Seja criativo e sugira ideias quando necessário. Use uma linguagem descontraída mas profissional.`;
  }

  private buildBattlePrompt(character: Character, opponentLastRhyme?: string, roundNumber: number = 1): string {
    const basePrompt = `Você é ${character.name}, um MC com estilo ${character.style}.

INFORMAÇÕES DO SEU PERSONAGEM:
- Nome: ${character.name}
- Estilo: ${character.style}
- Rival: ${character.rivalName}
- História do rival: ${character.rivalHistory}
- Motivo da rivalidade: ${character.rivalryReason}

INSTRUÇÕES PARA A BATALHA:
- Crie EXATAMENTE 4 versos de rima
- Use linguagem de rua, gírias do Rio de Janeiro
- Seja criativo, agressivo e inteligente
- Faça referencias ao rival (${character.rivalName})
- Use metáforas e wordplay
- Mantenha o estilo ${character.style}

${opponentLastRhyme ? `ÚLTIMA RIMA DO RIVAL:\n"${opponentLastRhyme}"\n\nRESPONDA A ESSA RIMA:` : `INICIE A BATALHA (Round ${roundNumber}):`}

Responda APENAS com os 4 versos, um por linha, sem numeração ou formatação extra.`;

    return basePrompt;
  }

  async generateConfigurationResponse(
    character: Partial<Character>, 
    userMessage: string, 
    question: string
  ): Promise<string> {
    try {
      const prompt = this.buildConfigurationPrompt(character, question);
      
      const response = await fetch(`${API_ENDPOINTS[1]}?key=${this.getApiKey(1)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${prompt}\n\nUsuário: ${userMessage}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          }
        })
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim();
      }
      
      throw new Error('Resposta inválida da API');
    } catch (error) {
      console.error('Erro ao gerar resposta de configuração:', error);
      return 'Desculpe, houve um erro. Por favor, tente novamente.';
    }
  }

  async generateBattleRhyme(
    character: Character, 
    opponentLastRhyme?: string, 
    roundNumber: number = 1
  ): Promise<string[]> {
    try {
      const apiKey = character.userId === 1 ? this.getApiKey(1) : this.getApiKey(2);
      const endpoint = character.userId === 1 ? API_ENDPOINTS[1] : API_ENDPOINTS[2];
      
      const prompt = this.buildBattlePrompt(character, opponentLastRhyme, roundNumber);
      
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150,
          }
        })
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const rhymeText = data.candidates[0].content.parts[0].text.trim();
        const verses = rhymeText.split('\n').filter(line => line.trim()).slice(0, 4);
        return verses.length >= 4 ? verses : [
          'Erro na geração dos versos,',
          'Mas minha flow não se perde,',
          'Vou mandar na próxima,',
          'E mostrar que sou o verde!'
        ];
      }
      
      throw new Error('Resposta inválida da API');
    } catch (error) {
      console.error('Erro ao gerar rima de batalha:', error);
      return [
        'Houve um erro no sistema,',
        'Mas minha rima não para,',
        'Vou voltar mais forte,', 
        'E mostrar quem é que manda!'
      ];
    }
  }
}

export const geminiService = new GeminiService();