# A11y MCP — Validador de Acessibilidade

> Valida a acessibilidade **WCAG 2.2 (AAA)** em arquivos HTML, JSX e TSX — diretamente no VS Code, com diagnósticos inline e ferramentas para o GitHub Copilot.

![VS Code](https://img.shields.io/badge/VS_Code-^1.95-007ACC?logo=visualstudiocode&logoColor=white)
![WCAG 2.2](https://img.shields.io/badge/WCAG-2.2_AAA-6B21A8)
![License: MIT](https://img.shields.io/badge/license-MIT-22c55e)

---

## Funcionalidades

### Diagnósticos inline

Os problemas aparecem instantaneamente no **painel de Problemas** (e como sublinhados no editor) toda vez que você abre ou salva um arquivo.

### Ferramentas para o GitHub Copilot (MCP)

Peça ao Copilot Chat para auditar seus arquivos ou explicar qualquer regra:

| Ferramenta                | O que faz                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------- | --- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------- | ----------------------------------------------------------------------- |
| `a11y_validate_file`      | Relatório completo de um único arquivo — linha, regra, critério WCAG, severidade e sugestão de fix |
| `a11y_validate_workspace` | Varre todos os arquivos HTML/JSX/TSX e retorna um resumo geral                                     |     | `a11y_validate_url` | Busca o HTML de uma URL em execução (ex: `http://localhost:3000`) e valida a acessibilidade. Ideal para apps SSR (Next.js, Remix). Para SPAs CSR (Vite, CRA) exibe um aviso pois o servidor retorna apenas o esqueleto vazio. |     | `a11y_get_rule` | Explica qualquer regra em detalhes (ex.: `img_01b`, `hx_03`, `aria_02`) |

**Exemplos de prompts:**

```
Valide a acessibilidade de src/pages/Home.tsx
```

```
O que significa a regra hx_03 e como corrijo?
```

```
Escaneie o workspace inteiro em busca de erros WCAG e me dê um resumo
```

### Comandos

| Comando                       | Descrição                                       |
| ----------------------------- | ----------------------------------------------- |
| `A11y: Validar Arquivo Atual` | Executa na aba ativa do editor                  |
| `A11y: Validar Workspace`     | Varre todos os arquivos suportados no workspace |

---

## Regras cobertas

A extensão implementa **30+ regras** baseadas no [ruleset do AccessMonitor](https://amagovpt.github.io/accessmonitor-rulesets/) e no [WCAG 2.2](https://www.w3.org/TR/WCAG22/), cobrindo os quatro princípios do WCAG:

| Categoria       | Regras                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------- |
| **Imagens**     | Alt ausente, alt não informativo, alt muito longo, decorativo não oculto                      |
| **Links**       | Nome acessível ausente, links adjacentes idênticos, mesmo texto com URLs diferentes           |
| **Botões**      | Nome acessível ausente                                                                        |
| **Formulários** | Label ausente, botão de envio ausente, label sem controle associado, autocomplete ausente     |
| **Títulos**     | Título vazio, sem H1, múltiplos H1, níveis pulados, nenhum título na página                   |
| **Página**      | `<title>` ausente, título vazio, `lang` ausente, `lang` inválido                              |
| **Landmarks**   | `<main>` ausente, `<main>` duplicado, link de pular navegação ausente                         |
| **Tabelas**     | Sem `<th>`, sem `<caption>`, tabelas aninhadas                                                |
| **Frames**      | `<iframe>` sem título                                                                         |
| **SVG**         | SVG significativo sem nome acessível                                                          |
| **ARIA**        | Role inválido, atributo obrigatório ausente, atributo `aria-*` desconhecido                   |
| **IDs**         | Atributos `id` duplicados                                                                     |
| **Meta**        | Zoom desativado no viewport, auto-refresh/redirect                                            |
| **Mídia**       | `<video>`/`<audio>` sem controles                                                             |
| **Eventos**     | Manipuladores de evento apenas com mouse (sem equivalente de teclado), `tabindex > 0`         |
| **Obsoleto**    | Elementos apresentacionais obsoletos (`<center>`, `<font>`, etc.), `<b>`/`<i>` não semânticos |
| **JSX**         | `onClick` em elemento não interativo sem role ou manipulador de teclado                       |

---

## Tipos de arquivo suportados

- HTML (`.html`, `.htm`)
- JSX / TSX (`.jsx`, `.tsx`)
- JavaScript / TypeScript com JSX (`.js`, `.ts`)

---

## Configurações da extensão

| Configuração         | Padrão                                  | Descrição                                            |
| -------------------- | --------------------------------------- | ---------------------------------------------------- |
| `a11y-mcp.wcagLevel` | `AAA`                                   | Nível mínimo de conformidade WCAG (`A`, `AA`, `AAA`) |
| `a11y-mcp.include`   | `["**/*.html", "**/*.jsx", "**/*.tsx"]` | Padrões glob dos arquivos a validar                  |
| `a11y-mcp.exclude`   | `["**/node_modules/**", ...]`           | Padrões glob dos arquivos a excluir da validação     |

---

## Como funcionam os diagnósticos

Cada problema exibe:

- **ID da regra** — ex.: `img_01b`
- **Severidade** — Erro 🔴, Aviso 🟡 ou Aviso informativo 🔵
- **Critério WCAG** — ex.: `1.1.1`, `2.4.4`
- **Nível de conformidade** — A, AA ou AAA
- **Sugestão de correção** — descrição prática do que alterar
- **Link de referência** — página da regra no AccessMonitor

---

## Referências

- [Rulesets do AccessMonitor](https://amagovpt.github.io/accessmonitor-rulesets/)
- [WCAG 2.2 — W3C](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA 1.2 — W3C](https://www.w3.org/TR/wai-aria-1.2/)
- [ACT Rules Community Group](https://act-rules.github.io/rules/)

---

## Contribuição

Issues e pull requests são bem-vindos em [github.com/LetsTN/a11y-mcp](https://github.com/LetsTN/a11y-mcp).

## Licença

[MIT](LICENSE)
