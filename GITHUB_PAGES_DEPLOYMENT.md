# GitHub Pages Deployment Guide for FinControle

## 🚀 Como Corrigir o Erro 404 no GitHub Pages

### Problema
O erro "404 - File not found" acontece quando o GitHub Pages não consegue encontrar os arquivos corretos para servir a aplicação.

### Solução Completa

#### 1. Verificar as Configurações do GitHub Pages
1. Va para o repositório no GitHub
2. Clique em **Settings** (Configurações)
3. Navegue até **Pages** no menu lateral
4. Certifique-se de que:
   - **Source**: GitHub Actions (não Branch)
   - **Build and deployment**: GitHub Actions

#### 2. Configurar os Secrets do Firebase
No repositório GitHub, vá para **Settings > Secrets and variables > Actions** e adicione:

```
VITE_FIREBASE_API_KEY=sua_chave_api_aqui
VITE_FIREBASE_AUTH_DOMAIN=fincontrole-cbd27.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fincontrole-cbd27
VITE_FIREBASE_STORAGE_BUCKET=fincontrole-cbd27.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

#### 3. Forçar Nova Execução do Workflow
1. Vá para **Actions** no GitHub
2. Clique no workflow "Deploy static content to Pages"
3. Clique em **Re-run all jobs** se houver falhas
4. Ou faça um novo commit para disparar o build

#### 4. Verificar o Build
- O workflow deve executar sem erros
- Deve aparecer: "✅ index.html found"
- O deploy deve ser bem-sucedido

#### 5. Aguardar Propagação
- GitHub Pages pode levar 5-10 minutos para atualizar
- Tente acessar: `https://seuusuario.github.io/seurepositorio/`

### Estrutura Correta dos Arquivos

Após o build, os arquivos devem estar organizados assim:
```
dist/
├── index.html          # Página principal
├── assets/
│   ├── index-xxxx.css  # Estilos
│   └── index-xxxx.js   # JavaScript
├── favicon.ico         # Ícone
├── 404.html           # Página de erro
└── .nojekyll          # Arquivo para GitHub Pages
```

### Comandos para Testar Localmente

```bash
# Instalar dependências
npm install

# Fazer build
cd client && npx vite build --outDir ../dist

# Verificar arquivos
ls -la dist/

# Testar localmente
npm run dev
```

### Resolução de Problemas Comuns

#### Erro "Firebase not configured"
- Verifique se todos os secrets estão configurados corretamente
- Confirme que os valores não têm espaços em branco

#### Erro "index.html not found"
- O workflow deve executar `npx vite build client --outDir ../dist`
- Verificar se a pasta dist/ foi criada corretamente

#### Aplicação não carrega
- Limpe o cache do navegador
- Tente em modo incógnito
- Verifique o console do navegador para erros

### URLs Importantes

- **Desenvolvimento Local**: `http://localhost:5000`
- **GitHub Pages**: `https://seuusuario.github.io/nome-do-repositorio/`
- **Firebase Console**: `https://console.firebase.google.com/project/fincontrole-cbd27`

### Próximos Passos

1. Configure todos os secrets do Firebase
2. Execute o workflow novamente
3. Aguarde 5-10 minutos para propagação
4. Acesse sua aplicação no GitHub Pages

Se ainda houver problemas, verifique os logs do workflow na aba Actions do GitHub.