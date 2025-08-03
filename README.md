# Hibiki Noise 🎧

Hibiki Noise é uma aplicação web projetada para aumentar a produtividade através do gerenciamento de sons ambientes. O aplicativo oferece uma variedade de sons relaxantes e ruídos (como som de chuva, fogueira e trovões) que ajudam a mascarar distrações sonoras do ambiente, criando um ambiente mais propício para o foco e concentração.

## Sobre o Projeto

Em ambientes de trabalho movimentados, home offices ou qualquer lugar onde o ruído ambiente possa ser uma distração, Hibiki Noise oferece uma solução elegante para melhorar sua experiência sonora e, consequentemente, sua produtividade.

## Tecnologias Utilizadas

- **React** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Superset JavaScript com tipagem estática
- **Vite** - Build tool e dev server
- **Zustand** - Gerenciamento de estado
- **ESLint** - Linter para JavaScript/TypeScript

## Recursos de Áudio

Todos os sons ambientes utilizados neste projeto foram obtidos através do [Freesound](https://freesound.org/) sob a licença Creative Commons 0 (CC0). Esta licença permite o uso irrestrito dos arquivos de áudio, sem necessidade de atribuição.

### Créditos dos Áudios

- **Som de Chuva**: ["Under Tree In Rain.mp3" por causative](https://freesound.org/s/102674/) - Licença: Creative Commons 0
- **Som de Fogueira**: ["Bonfire HQ.wav" por tosha73](https://freesound.org/s/513280/) - Licença: Creative Commons 0
- **Som de Trovão**: ["thunder 2" por elmoustachio](https://freesound.org/s/476736/) - Licença: Creative Commons 0

## Como Executar Localmente

### Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório
```bash
git clone <seu-repositorio>
cd hibiki-web
```

2. Instale as dependências
```bash
npm install
# ou
yarn
```

3. Execute o projeto em modo de desenvolvimento
```bash
npm run dev
# ou
yarn dev
```

O aplicativo estará disponível em `http://localhost:5173`

## Licença

Este projeto está licenciado sob a Creative Commons Attribution-NonCommercial 4.0 International License - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Configuração do ESLint

Se você estiver desenvolvendo uma aplicação para produção, recomendamos atualizar a configuração para habilitar regras de lint com verificação de tipos:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
