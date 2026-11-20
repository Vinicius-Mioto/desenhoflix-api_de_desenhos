const URL_API = "https://rickandmortyapi.com/api/character";

const listaPersonagens = document.getElementById("lista-personagens");
const mensagem = document.getElementById("mensagem");
const formularioBusca = document.getElementById("form-busca");
const campoBusca = document.getElementById("campo-busca");
const botaoAnterior = document.getElementById("botao-anterior");
const botaoProximo = document.getElementById("botao-proximo");
const indicadorPagina = document.getElementById("indicador-pagina");

let paginaAtual = 1;
let totalPaginas = 1;
let nomeBuscado = "";
let numeroRequisicao = 0;

function traduzirStatus(status) {
    const traducoes = {
        Alive: "Vivo",
        Dead: "Morto",
        unknown: "Desconhecido"
    };

    return traducoes[status] || "Desconhecido";
}

function criarCard(personagem) {
    const card = document.createElement("article");
    card.className = "card";

    const imagem = document.createElement("img");
    imagem.className = "card__imagem";
    imagem.src = personagem.image;
    imagem.alt = `Imagem de ${personagem.name}`;
    imagem.loading = "lazy";
    imagem.width = 300;
    imagem.height = 300;

    const conteudo = document.createElement("div");
    conteudo.className = "card__conteudo";

    const status = document.createElement("span");
    status.className = `card__status card__status--${personagem.status.toLowerCase()}`;
    status.textContent = traduzirStatus(personagem.status);

    const nome = document.createElement("h3");
    nome.className = "card__nome";
    nome.textContent = personagem.name;

    const descricao = document.createElement("p");
    descricao.className = "card__descricao";
    descricao.textContent = `Espécie: ${personagem.species}. Origem: ${personagem.origin.name}.`;

    conteudo.append(status, nome, descricao);
    card.append(imagem, conteudo);

    return card;
}

function atualizarPaginacao() {
    indicadorPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    botaoAnterior.disabled = paginaAtual <= 1;
    botaoProximo.disabled = paginaAtual >= totalPaginas;
}

async function carregarPersonagens(pagina = 1, nome = "") {
    const requisicao = ++numeroRequisicao;

    listaPersonagens.replaceChildren();
    mensagem.textContent = "Carregando personagens...";
    botaoAnterior.disabled = true;
    botaoProximo.disabled = true;

    const url = new URL(URL_API);
    url.searchParams.set("page", pagina);

    if (nome) {
        url.searchParams.set("name", nome);
    }

    try {
        const resposta = await fetch(url.toString());

        if (requisicao !== numeroRequisicao) {
            return;
        }

        if (resposta.status === 404) {
            paginaAtual = 1;
            totalPaginas = 1;
            mensagem.textContent = "Nenhum personagem encontrado. Tente outro nome.";
            atualizarPaginacao();
            return;
        }

        if (!resposta.ok) {
            throw new Error(`Erro na API: ${resposta.status}`);
        }

        const dados = await resposta.json();

        if (requisicao !== numeroRequisicao) {
            return;
        }

        paginaAtual = pagina;
        totalPaginas = dados.info.pages;

        const fragmento = document.createDocumentFragment();

        dados.results.forEach(function (personagem) {
            fragmento.appendChild(criarCard(personagem));
        });

        listaPersonagens.appendChild(fragmento);
        mensagem.textContent = `${dados.info.count} personagem(ns) encontrado(s).`;
        atualizarPaginacao();
    } catch (erro) {
        if (requisicao !== numeroRequisicao) {
            return;
        }

        paginaAtual = 1;
        totalPaginas = 1;
        mensagem.textContent = "Não foi possível carregar os personagens. Tente novamente.";
        atualizarPaginacao();
        console.error("Erro ao consultar a API:", erro);
    }
}

formularioBusca.addEventListener("submit", function (evento) {
    evento.preventDefault();

    nomeBuscado = campoBusca.value.trim();
    carregarPersonagens(1, nomeBuscado);
});

botaoAnterior.addEventListener("click", function () {
    if (paginaAtual > 1) {
        carregarPersonagens(paginaAtual - 1, nomeBuscado);
    }
});

botaoProximo.addEventListener("click", function () {
    if (paginaAtual < totalPaginas) {
        carregarPersonagens(paginaAtual + 1, nomeBuscado);
    }
});

carregarPersonagens();
