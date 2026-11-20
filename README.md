# Portal do Multiverso

Projeto acadêmico de consumo de API com **HTML, CSS e JavaScript puros**.

## Objetivo

Exibir cards de personagens de Rick and Morty com foto, nome, status, espécie e origem, consumindo os dados da API pública.

## Funcionalidades

- Listagem de personagens via `fetch()` e `async/await`.
- Pesquisa por nome.
- Paginação usando a resposta da API.
- Indicadores de carregamento, erro e busca sem resultados.
- Interface responsiva para computadores e celulares.

## Como executar

1. Abra a pasta no Visual Studio Code.
2. Use a extensão **Live Server** para abrir `index.html` ou execute `python -m http.server 5500` no terminal dentro da pasta.
3. Acesse `http://localhost:5500` no navegador caso tenha usado Python.
4. É necessário acesso à internet para carregar os dados da API.

## API

- Documentação: https://rickandmortyapi.com/documentation
- Recurso usado: https://rickandmortyapi.com/api/character

A API não oferece uma descrição narrativa dos personagens. O campo de texto dos cards apresenta informações existentes na API (espécie,  origem e status).

## Estrutura

```text
desenhoflix-api_de_desenhos/
├── css/
│   └── style.css
├── js/
│   └── script.js
├── index.html
├── .gitignore
└── README.md
```

## Tecnologias

HTML5, CSS3 e JavaScript ES6+.
