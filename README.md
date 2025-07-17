# FinControle 💰

Sistema completo de controle financeiro pessoal com interface mobile-first e integração total com Firebase.

## 🚀 Características

- **100% Mobile-First**: Interface otimizada para dispositivos móveis
- **Autenticação Segura**: Login via Google OAuth com Firebase Auth
- **Controle Completo**: Gestão de bancos, cartões, receitas, despesas e metas
- **Sistema de Parcelas**: Criação automática de parcelas com datas incrementais
- **Temas**: Suporte a modo claro e escuro
- **Relatórios Avançados**: Gráficos e análises financeiras detalhadas
- **Projeção de Saldo**: Previsão financeira até 24 meses
- **Deploy Automático**: CI/CD com GitHub Actions e Firebase Hosting

## 🛠️ Tecnologias

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes
- **TanStack Query** para gerenciamento de estado
- **Vite** para build otimizado

### Backend
- **Firebase Firestore** para banco de dados
- **Firebase Auth** para autenticação
- **Express.js** para API (desenvolvimento)
- **Node.js** runtime

### Deploy
- **Firebase Hosting** para hospedagem
- **GitHub Actions** para CI/CD
- **Firestore Security Rules** para segurança

## 🚀 Publicação no GitHub

### Arquivos Incluídos para Publicação
- `index.html` - Página inicial otimizada para GitHub Pages
- `.github/workflows/github-pages.yml` - Deploy automático
- `PUBLISHING_GUIDE.md` - Guia completo de publicação
- `.env.example` - Template de configuração Firebase

### Passos Rápidos
1. **Criar repositório no GitHub**
2. **Configurar secrets do Firebase** (ver PUBLISHING_GUIDE.md)
3. **Fazer upload dos arquivos**
4. **Ativar GitHub Pages** (Settings > Pages > GitHub Actions)
5. **Acessar**: `https://seu-usuario.github.io/fincontrole`

📖 **Guia completo**: Veja [PUBLISHING_GUIDE.md](PUBLISHING_GUIDE.md)

## 📦 Instalação Local

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no Firebase

### Configuração Local

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/fincontrole.git
cd fincontrole
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o Firebase**
- Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
- Ative Authentication (Google OAuth)
- Ative Firestore Database
- Ative Hosting

4. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Preencha as variáveis no arquivo `.env`:
```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

5. **Execute o projeto**
```bash
npm run dev
```

## 🔐 Configuração do Firebase

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### Domínios Autorizados
Adicione seus domínios em Authentication > Settings > Authorized domains:
- `localhost` (desenvolvimento)
- `seu-dominio.web.app` (produção)
- `seu-dominio-personalizado.com` (opcional)

## 🚀 Deploy Automático

### Opção 1: GitHub Pages (Recomendado)

1. **Ative o GitHub Pages**:
   - Settings > Pages
   - Source: "GitHub Actions"

2. **Configure os Secrets** no GitHub (Settings > Secrets and variables > Actions):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

3. **Push para main** - Deploy automático será executado
4. **Acesso**: `https://seu-usuario.github.io/fincontrole`

### Opção 2: Firebase Hosting

1. **Configure os Secrets** no GitHub (inclua também):
```
FIREBASE_SERVICE_ACCOUNT_FINCONTROLE_CBD27
```

2. **Push para main** - Deploy automático será executado
3. **Acesso**: `https://fincontrole-cbd27.web.app`

### Deploy Manual
```bash
npm run build
firebase deploy
```

## 📱 Funcionalidades

### Gestão Financeira
- **Bancos**: Cadastro e controle de saldo
- **Cartões de Crédito**: Gestão de limites e faturas
- **Receitas**: Controle de entradas com status
- **Despesas**: Registro de gastos com categorias
- **Parcelas**: Sistema automático de parcelamento

### Relatórios
- **Dashboard**: Visão geral dos dados financeiros
- **Gráficos**: Análise visual por categorias
- **Projeção**: Previsão de saldo futuro
- **Filtros**: Análise por período personalizado

### Sistema de Usuários
- **Autenticação**: Login seguro via Google
- **Dados Isolados**: Cada usuário vê apenas seus dados
- **Sincronização**: Dados sincronizados em tempo real

## 📊 Estrutura do Projeto

```
fincontrole/
├── client/              # Frontend React
├── server/              # Backend Express
├── shared/              # Tipos e schemas compartilhados
├── .github/workflows/   # CI/CD
├── firebase.json        # Configuração Firebase
├── firestore.rules      # Regras de segurança
└── package.json         # Dependências
```

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm run preview  # Preview da build
npm run check    # Verificação TypeScript
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de domínio não autorizado**
   - Adicione o domínio aos domínios autorizados no Firebase

2. **Falha na autenticação**
   - Verifique as credenciais do Firebase
   - Confirme se o Google OAuth está ativo

3. **Erro de build**
   - Verifique se todas as variáveis de ambiente estão configuradas
   - Execute `npm ci` para reinstalar dependências

### Logs e Debug
- Verifique o console do navegador
- Confira os logs do Firebase Console
- Analise os logs do GitHub Actions

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação do Firebase
- Verifique os logs de deploy

---

**FinControle** - Controle financeiro pessoal moderno e seguro 🚀