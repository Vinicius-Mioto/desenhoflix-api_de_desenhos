# DesenhoFlix

Um catálogo visual de personagens de **Rick and Morty**, criado com HTML, CSS e JavaScript puros para uma atividade de integração com API pública.

## O que o projeto faz

- Consome dados da [Rick and Morty API](https://rickandmortyapi.com/documentation) usando `fetch()` e `async/await`.
- Exibe cards com imagem, nome, status, espécie e origem dos personagens.
- Permite pesquisar personagens pelo nome.
- Navega entre as páginas de resultados fornecidas pela API.
- Trata carregamento, erros de conexão e buscas sem resultado, com até 5 tentativas automáticas de API a cada clique.
- Preserva a página e os cards quando uma consulta falha; mantém página e pesquisa na URL após atualização.
- Carrega imagens em grupos de até 4, repetindo cada tentativa até 4 vezes antes de usar uma arte local de reserva.
- Adapta a interface para dispositivos móveis.

## Como executar

1. Abra a pasta do repositório no VS Code.
2. Abra `index.html` com a extensão **Live Server** ou rode `python -m http.server 5500` na raiz do projeto.
3. Se usar o Python, acesse `http://localhost:5500`.
4. Mantenha uma conexão à internet para carregar as fontes e os personagens da API.

## Organização

```text
desenhoflix/
├── assets/
│   ├── favicon.svg
│   └── personagem-indisponivel.svg
├── css/
│   └── style.css
├── js/
│   └── script.js
├── index.html
├── .gitignore
└── README.md
```

## Design

Identidade visual escura com destaques em verde-lima e violeta; seção de abertura com portal ilustrado em CSS e retratos carregados da API; cartões e busca mantidos como parte central do trabalho.

Os retratos de destaque usam imagens disponibilizadas pela própria API. A descrição nos cards é composta dos campos **espécie** e **origem**, pois a API não oferece biografias narrativas.

## Limitações de conexão

O site depende da disponibilidade da API e das imagens hospedadas nela. As novas tentativas ajudam em falhas temporárias, mas não corrigem problemas persistentes no servidor, no provedor ou no navegador. A imagem local de reserva impede que um card fique visualmente quebrado.

## API

- Documentação: https://rickandmortyapi.com/documentation
- Endpoint: https://rickandmortyapi.com/api/character
