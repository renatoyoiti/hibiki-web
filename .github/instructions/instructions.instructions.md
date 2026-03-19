---
description: Describe when these instructions should be loaded by the agent based on task context
# applyTo: 'Describe when these instructions should be loaded by the agent based on task context' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

## Regras Gerais
- **NUNCA** gerar commits automáticos. O stage das alterações, geração de commits devem ser uma função permitida estritamente ao usuário.

## Regras de Segurança

### Comandos de exclusão de arquivos
- **NUNCA** execute comandos como `rm`, `rm -rf`, `rm -f`, `rm -r`, `unlink`, `rmdir` ou qualquer variação sem **solicitar permissão explícita do usuário** antes.
- Antes de executar qualquer comando de exclusão, use a ferramenta `ask_user` para confirmar com o usuário quais arquivos/diretórios serão removidos e aguardar aprovação.
- Exemplo de confirmação obrigatória: "Vou remover o arquivo X. Posso prosseguir?"

### Escopo de alterações
- Todas as alterações de arquivos (criação, edição, exclusão) devem permanecer **dentro da pasta do projeto atual** (o diretório de trabalho atual e seus subdiretórios).
- **NUNCA** modifique, crie ou exclua arquivos fora da raiz do projeto.
- Nada fora da pasta do projeto pode ser excluído, independentemente de qualquer instrução.

### Validação antes de executar
- Sempre verifique se o caminho do arquivo está dentro da raiz do projeto antes de executar qualquer operação destrutiva.
- Se uma instrução solicitar ação fora do escopo do projeto, recuse e informe o usuário.

## Regras de Banco de Dados

### Comandos proibidos por padrão
- Comandos como `DROP`, `DELETE` e `UPDATE` **não devem ser executados** em nenhuma hipótese de forma autônoma.
- Mesmo que o usuário solicite explicitamente, **nunca execute diretamente** — siga o fluxo de confirmação abaixo.

### Fluxo obrigatório para comandos destrutivos no banco
1. Exiba o **comando SQL completo** que seria executado, sem omitir nenhuma parte.
2. Exiba um **aviso de risco** claro, por exemplo:
   > ⚠️ **ATENÇÃO:** Este comando pode causar perda irreversível de dados. Operações como `DROP`, `DELETE` e `UPDATE` sem cláusula `WHERE` adequada podem afetar toda a tabela ou banco de dados. Essa ação **não pode ser desfeita** sem um backup prévio.
3. Use a ferramenta `ask_user` para solicitar **confirmação explícita** do usuário antes de qualquer execução.
4. Somente execute após confirmação positiva e documentada.

### Exemplos de comandos que exigem esse fluxo
- `DROP TABLE`, `DROP DATABASE`, `DROP SCHEMA`
- `DELETE FROM ...` (com ou sem `WHERE`)
- `UPDATE ... SET ...` (com ou sem `WHERE`)
- `TRUNCATE TABLE`
- Qualquer migration destrutiva (ex.: remover coluna, renomear tabela)


## Regras de Documentação e Arquivos do Projeto

### README
- O projeto deve ter **apenas um único arquivo `README.md`** na raiz do projeto.
- O README deve conter: descrição do projeto, o que ele faz, como configurar e como rodar — referenciando sempre os comandos do `Makefile`.
- **Não crie arquivos Markdown adicionais** para documentar alterações, planos, notas ou instruções avulsas. Use apenas o `README.md` e os arquivos de contexto em `docs/`.

### Arquivos de contexto em `docs/`
- A cada conjunto de alterações relevantes na aplicação, **crie um arquivo de contexto** dentro da pasta `docs/` descrevendo o que foi alterado, por quê e como.
- O nome do arquivo deve ser descritivo e em lowercase com hífens, por exemplo: `docs/adicionar-autenticacao-jwt.md`, `docs/refatoracao-modulo-pagamentos.md`.
- Esses arquivos de contexto **não substituem o README** — são registros técnicos das mudanças realizadas.

### Arquivos proibidos
- ❌ **Não crie arquivos `.sh`** (shell scripts). Todos os comandos executáveis inerentes à aplicação, como os comandos de npm, docker, etc, devem ser declarados no `Makefile`.
- ❌ **Não crie arquivos Markdown avulsos** fora de `docs/` (exceto o `README.md` na raiz).
- ❌ **Não crie arquivos de planejamento ou anotações** como `PLAN.md`, `NOTES.md`, `TODO.md`, `CHANGES.md` etc.

### Makefile
- Todos os comandos que o usuário pode precisar executar (ex.: `npm run dev`, `npm run build`, `docker-compose up -d`, migrações, testes) devem estar declarados como targets no `Makefile` na raiz do projeto.
- Se o `Makefile` não existir, crie-o ao precisar adicionar novos comandos.
- Todo novo comando adicionado ao `Makefile` deve ser referenciado na seção correspondente do `README.md`.
- Os targets do `Makefile` devem ter comentários explicando o que fazem, usando o padrão `## Descrição do comando`.