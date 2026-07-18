# Media History Registry

> **Your media history belongs to you. Store it as structured data.**

---

## O que e isso?

Media History Registry nao e um app de streaming. Nao e uma rede social. Nao e
um recomendador. Nao e um gamificador para assistir mais coisas.

E um **sistema de dados estruturados** para transformar o historico audiovisual
pessoal em um registro pesquisavel, versionavel e portatil, armazenado como
arquivos JSON em um repositorio GitHub que **voce** controla.

Sem banco de dados. Sem contas. Sem backend obrigatorio. Sem API externa
necessaria para o funcionamento principal. Apenas dados estruturados,
versionados pelo Git.

---

## Por que existe?

Esse projeto nasceu de uma necessidade pessoal: **a preocupacao em registrar o
que foi assistido ao longo dos anos**.

Nao e "quero descobrir o que assistir". Nao e "quero competir com outras
pessoas". E: *"quero uma forma confiavel de documentar minha historia de
series, filmes, animes, documentarios, K-dramas e especiais sem depender de uma
plataforma fechada."*

A ideia parte de perguntas simples:

- O que eu assisti em 2026?
- Quais temporadas de uma serie eu ja conclui?
- Quando eu assisti determinado anime?
- Quais obras foram canceladas pela plataforma, mas eu ainda completei?
- Quais series eu dropei, pausei ou estou assistindo?
- Quais K-dramas, filmes, documentarios ou especiais aparecem no meu historico?

E tudo isso **sem banco de dados remoto**. O repositorio e a fonte da verdade.

---

## Como funciona?

### Camada de dados

Os dados sao organizados em arquivos JSON dentro do repositorio:

| Conceito | Descricao |
|---|---|
| **Media Item** | Define a obra: serie, filme, anime, documentario, especial etc. |
| **Watch Record** | Define um evento de consumo: o que foi assistido, em que ano, qual unidade e com qual status pessoal |
| **Derived Library View** | A visualizacao calculada pela aplicacao a partir dos arquivos JSON |

A separacao principal e esta:

```text
Media Item = o que existe
Watch Record = o que voce consumiu
Library View = como o app mostra
```

Isso evita duplicar metadados da mesma obra em varios anos. A obra existe uma
vez; cada temporada, filme, episodio, arco, especial ou rewatch vira um registro
proprio.

<details>
<summary><strong>Exemplo minimo de Media Item</strong></summary>

```json
{
  "id": "attack-on-titan",
  "title": "Attack on Titan",
  "original_title": "Shingeki no Kyojin",
  "category": "anime",
  "subcategories": [],
  "format": "series",
  "status": "ended",
  "genres": ["action", "dark-fantasy"],
  "countries": ["JP"],
  "studios": ["Wit Studio", "MAPPA"],
  "directors": [],
  "first_release_year": 2013,
  "external_ids": {
    "imdb": null,
    "tmdb": null,
    "anilist": null,
    "myanimelist": null
  },
  "poster": null,
  "notes": null
}
```

</details>

<details>
<summary><strong>Exemplo minimo de Watch Record</strong></summary>

```json
{
  "id": "2026-attack-on-titan-s04",
  "media_id": "attack-on-titan",
  "year": 2026,
  "unit": {
    "type": "season",
    "season_number": 4
  },
  "watch_status": "completed",
  "started_at": null,
  "finished_at": null,
  "platform": "Crunchyroll",
  "rewatch": false,
  "rating": null,
  "favorite": false,
  "notes": null
}
```

</details>

### Sistema de unidades

Conteudo audiovisual nao tem uma unica metrica linear como paginas de um livro.
Por isso, cada Watch Record informa a unidade assistida:

| Unidade | Uso |
|---|---|
| `season` | Temporada numerada |
| `limited_season` | Obra de temporada unica ou minisserie |
| `episode` | Episodio especifico |
| `arc` | Arco narrativo, comum em animes longos |
| `movie` | Filme |
| `special` | Especial, OVA ou conteudo extra |
| `full_work` | Obra inteira como unidade unica |
| `unspecified` | Unidade desconhecida ou indefinida |

Os rotulos visuais como `S01`, `S04`, `LS`, `MOV` e `SP` sao derivados pelo app.
Eles nao ficam salvos no JSON.

### Aplicacao web

A aplicacao web tem dois propositos:

1. **Geracao de dados** - Formularios que produzem arquivos JSON validos, com
   nome de arquivo e caminho esperados. Voce preenche, copia ou baixa o JSON e
   faz o commit manualmente.

2. **Visualizacao de dados** - O app le os arquivos JSON do repositorio durante
   o build e monta uma biblioteca visual. Filtros, ordenacao, agrupamentos e
   rotulos sao derivados em runtime.

### O commit e manual

Isso e intencional. A aplicacao web **nao** faz push no GitHub. Ela gera
arquivos. Voce decide quando salvar, commitar e enviar.

Esse fluxo mantem o historico simples, transparente e sob seu controle.

---

## Estrutura do Projeto

Estrutura publica atual:

```text
media-history-registry/
|-- .gitignore
|-- README.md
|-- data/
|   |-- history/
|   |   |-- 2024/
|   |   |   `-- your-name.json
|   |   `-- 2026/
|   |       |-- boots-s01.json
|   |       |-- bridgerton-s04.json
|   |       |-- spy-family-s02.json
|   |       `-- typhoon-family.json
|   `-- media/
|       |-- anime/
|       |   `-- spy-family.json
|       |-- movie/
|       |   `-- your-name.json
|       `-- series/
|           |-- boots.json
|           |-- bridgerton.json
|           `-- typhoon-family.json
|-- examples/
|   |-- media-example.json
|   `-- watch-record-example.json
|-- schemas/
|   |-- media.schema.json
|   `-- watch-record.schema.json
|-- scripts/
|   |-- slugify.js
|   `-- validate.js
`-- web/
    |-- index.html
    |-- package.json
    |-- vite.config.js
    `-- src/
        |-- App.jsx
        |-- components/
        |   |-- CopyButton.jsx
        |   |-- DownloadButton.jsx
        |   |-- FileInfo.jsx
        |   |-- JsonOutputBlock.jsx
        |   `-- JsonPreview.jsx
        |-- main.jsx
        |-- styles.css
        `-- utils/
            |-- jsonGeneration.js
            `-- slugify.js
```

> A estrutura vai crescer junto com o codigo. Tudo que for adicionado deve
> aparecer aqui quando virar parte publica do projeto. Documentos internos de
> planejamento, como planos e prompts de execucao, ficam fora dos commits de
> produto por padrao.

---

## Deploy estatico

O MVP planejado sera uma SPA estatica publicada no GitHub Pages por GitHub
Actions.

- O app usa Vite e `import.meta.glob` para descobrir JSONs em `data/media/` e
  `data/history/` durante o build.
- A biblioteca publicada e um snapshot estatico do repositorio naquele commit.
- Novos registros entram no site depois de commit, push e novo build.
- Nenhuma API externa, login, backend ou credencial e exigida para o core.

---

## Decisoes de design

| Decisao | Justificativa |
|---|---|
| **JSON ao inves de banco de dados** | Arquivos sao legiveis por humanos, portateis e versionaveis |
| **Media Item separado de Watch Record** | A obra e descrita uma vez; cada consumo referencia essa obra |
| **Um arquivo por registro** | Diffs pequenos, menos conflitos e historico Git mais claro |
| **Rotulos derivados** | `S01`, `LS`, `MOV` e similares pertencem a UI, nao aos dados primarios |
| **Status separado** | `cancelled` da obra nao e igual a `dropped` do usuario |
| **Commit manual** | O usuario mantem controle total sobre o repositorio |
| **React + Vite + JavaScript** | Boa base para formularios, validacao, biblioteca visual e build estatico |
| **Sem API externa obrigatoria** | O dado continua util mesmo se qualquer servico externo desaparecer |
