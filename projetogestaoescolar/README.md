# EduControl PRO

Sistema de gestão escolar desenvolvido com React, TypeScript e Vite.

## 🚀 Deploy na Vercel

### Passo 1: Preparar o Repositório
1. Certifique-se de que todas as alterações estão commitadas
2. Envie o código para o GitHub:
   ```bash
   git push origin main
   ```

### Passo 2: Configurar na Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "Add New Project"
3. Importe seu repositório do GitHub
4. Configure as seguintes opções:
   - **Framework Preset**: Vite
   - **Root Directory**: `projetogestaoescolar`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Passo 3: Adicionar Variáveis de Ambiente
Na aba "Environment Variables" da Vercel, adicione:

```
VITE_SUPABASE_URL=https://vxtfhwetkupfufeusxws.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZod2V0a3VwZnVmZXVzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTQxNDIsImV4cCI6MjA4NjE3MDE0Mn0.N-cYYh5Xk1NX75d_YNmRRxkDGhsw-578nGwZekw0cUI
```

⚠️ **Importante**: Adicione essas variáveis para todos os ambientes (Production, Preview, Development)

### Passo 4: Deploy
1. Clique em "Deploy"
2. Aguarde o build finalizar
3. Seu app estará disponível em: `https://seu-projeto.vercel.app`

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📋 Requisitos
- Node.js 18+
- npm ou yarn
- Conta no Supabase (para banco de dados)

## 🔐 Credenciais Padrão
- **Coordenador**: coordenador@gmail.com / mudar123
- **Professor**: prof@edu.com / 123
- **Monitor**: mon@edu.com / 123

## 📦 Estrutura do Projeto

```
projetogestaoescolar/
├── services/          # Serviços (Storage, Supabase)
├── *.tsx              # Componentes React
├── types.ts           # Definições TypeScript
├── index.html         # HTML principal
├── vite.config.ts     # Configuração Vite
└── vercel.json        # Configuração Vercel
```

## 🌟 Funcionalidades
- Gestão de Alunos, Professores, Turmas e Disciplinas
- Monitoramento de Sala de Aula
- Relatórios e Dashboard
- Sistema de Ocorrências
- FOA (Ficha de Observação do Aluno)
- Integração com Supabase

## 📄 Licença
Proprietary - EduControl PRO
