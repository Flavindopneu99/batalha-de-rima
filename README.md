# Batalha de Rima com Duas IAs

Uma plataforma interativa onde dois usuários podem configurar seus próprios personagens de IA para batalhas de rima em tempo real.

## 🎯 Características Principais

- **Três Ambientes de Chat Independentes**:
  - Chat 1: Configuração do personagem IA do Usuário 1
  - Chat 2: Configuração do personagem IA do Usuário 2  
  - Chat 3: Arena de batalha entre as duas IAs

- **Configuração Detalhada de Personagens**:
  - Nome do personagem MC
  - Estilo de rima (agressivo, filosófico, sarcástico, etc.)
  - Nome e história do rival
  - Motivo da rivalidade

- **Arena de Batalha em Tempo Real**:
  - Rimas alternadas automaticamente
  - 4 versos por rodada
  - Linguagem rica em gírias e metáforas
  - Sistema de rounds (padrão: 6 rounds)

## 🚀 Tecnologias

- **Frontend**: React + TypeScript + Tailwind CSS
- **IA**: Google Gemini 2.5 Flash-Lite
- **Armazenamento**: LocalStorage (simulando MongoDB)
- **Ícones**: Lucide React
- **Build Tool**: Vite

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure suas chaves da API:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas chaves da Google Gemini API:

```env
VITE_API_KEY_1=sua_primeira_chave_aqui
VITE_API_KEY_2=sua_segunda_chave_aqui
```

### 2. Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🎮 Como Usar

### 1. Configuração dos Personagens

1. **Jogador 1**: Acesse a aba "Jogador 1" e responda às perguntas para configurar seu MC
2. **Jogador 2**: Acesse a aba "Jogador 2" e configure o segundo personagem
3. O sistema guiará você através de 5 etapas:
   - Nome do personagem
   - Estilo de rima
   - Nome do rival
   - História do rival
   - Motivo da rivalidade

### 2. Batalha

1. Após configurar ambos personagens, acesse a "Arena de Batalha"
2. Clique em "Iniciar Batalha" 
3. As IAs começarão a rimar alternadamente
4. Acompanhe as rimas em tempo real
5. A batalha termina após 6 rounds (12 rimas no total)

## 🔧 Funcionalidades Técnicas

### Integração com Google Gemini

- **Configuração**: Prompts dinâmicos para coleta de dados dos personagens
- **Batalha**: Prompts contextualizados com informações do rival e últimas rimas
- **Segurança**: Chaves de API gerenciadas via variáveis de ambiente

### Sistema de Dados

- Armazenamento local persistente
- Backup automático de personagens e batalhas
- Sistema de recuperação de batalhas em andamento

### Interface Responsiva

- Design adaptativo para mobile, tablet e desktop
- Tema hip-hop com cores vibrantes
- Animações suaves e micro-interações
- Feedback visual em tempo real

## 🎨 Design

O projeto utiliza uma paleta de cores inspirada na cultura hip-hop:

- **Primária**: Roxo (#7C3AED) e Rosa (#EC4899)
- **Secundária**: Azul neon (#06B6D4) e Vermelho (#EF4444)
- **Neutros**: Escalas de cinza para contraste
- **Destaques**: Dourado (#F59E0B) para elementos especiais

## 🔐 Segurança

- ✅ Chaves de API mantidas em variáveis de ambiente
- ✅ Nunca expostas no código fonte do frontend
- ✅ Validação de entrada de dados
- ✅ Tratamento de erros da API

## 📱 Responsividade

- **Mobile**: Layout otimizado para telas pequenas
- **Tablet**: Interface adaptada para telas médias  
- **Desktop**: Experiência completa com todas as funcionalidades

## 🚀 Próximas Funcionalidades

- [ ] Sistema de votação para escolher o vencedor
- [ ] Histórico detalhado de batalhas
- [ ] Compartilhamento de batalhas
- [ ] Modo multiplayer online real
- [ ] Integração com redes sociais
- [ ] Sistema de rankings
- [ ] Personalização visual dos personagens

## 📄 Licença

Este projeto foi desenvolvido para demonstração da integração com APIs de IA e técnicas modernas de desenvolvimento web.

---

**Desenvolvido com ❤️ para a comunidade de batalha de rima**