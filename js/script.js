const URL_API = "https://rickandmortyapi.com/api/character";
const IMAGEM_RESERVA = "assets/personagem-indisponivel.svg";

// Limites das consultas à API: todas as tentativas ocorrem após um único clique.
const MAX_TENTATIVAS_API = 5;
const TEMPO_LIMITE_API = 15000;

// Evita muitas imagens sendo solicitadas ao servidor ao mesmo tempo.
const MAX_TENTATIVAS_IMAGEM = 4;
const TEMPO_LIMITE_IMAGEM = 15000;
const MAX_IMAGENS_SIMULTANEAS = 4;

const listaPersonagens = document.getElementById("lista-personagens");
const mensagem = document.getElementById("mensagem");
const formularioBusca = document.getElementById("form-busca");
const campoBusca = document.getElementById("campo-busca");
const botaoAnterior = document.getElementById("botao-anterior");
const botaoProximo = document.getElementById("botao-proximo");
const indicadorPagina = document.getElementById("indicador-pagina");
const avisoErro = document.getElementById("aviso-erro");
const botaoTentarNovamente = document.getElementById("botao-tentar-novamente");

let paginaAtual = 1;
let totalPaginas = 1;
let nomeBuscado = "";
let numeroRequisicao = 0;
let requisicaoEmAndamento = false;
let controladorRequisicao = null;
let ultimaSolicitacao = { pagina: 1, nome: "" };

const cachePaginas = new Map();

// Controle independente das imagens; falhas nelas não bloqueiam a paginação.
let controladorImagens = new AbortController();
const controladorImagensHero = new AbortController();
let observadorImagens = null;
let filaImagens = [];
let imagensEmAndamento = 0;

function traduzirStatus(status) {
    const traducoes = {
        Alive: "Vivo",
        Dead: "Morto",
        unknown: "Desconhecido"
    };

    return traducoes[status] || "Desconhecido";
}

function esperar(milissegundos, sinal) {
    return new Promise(function (resolver, rejeitar) {
        if (sinal && sinal.aborted) {
            rejeitar(new DOMException("Operação cancelada", "AbortError"));
            return;
        }

        const temporizador = setTimeout(function () {
            if (sinal) {
                sinal.removeEventListener("abort", cancelar);
            }

            resolver();
        }, milissegundos);

        function cancelar() {
            clearTimeout(temporizador);
            rejeitar(new DOMException("Operação cancelada", "AbortError"));
        }

        if (sinal) {
            sinal.addEventListener("abort", cancelar, { once: true });
        }
    });
}

// Faz o download em uma imagem temporária. Só troca a imagem do card após
// um carregamento bem-sucedido, para não mostrar o ícone de imagem quebrada.
function testarImagem(url, sinal) {
    return new Promise(function (resolver) {
        if (sinal.aborted) {
            resolver(false);
            return;
        }

        const temporaria = new Image();
        let concluido = false;

        const temporizador = setTimeout(function () {
            finalizar(false);
        }, TEMPO_LIMITE_IMAGEM);

        function finalizar(sucesso) {
            if (concluido) {
                return;
            }

            concluido = true;
            clearTimeout(temporizador);
            sinal.removeEventListener("abort", cancelar);
            temporaria.onload = null;
            temporaria.onerror = null;

            if (!sucesso) {
                // Interrompe a tentativa que ficou pendurada no navegador.
                temporaria.src = "";
            }

            resolver(sucesso);
        }

        function cancelar() {
            finalizar(false);
        }

        temporaria.onload = function () {
            finalizar(true);
        };

        temporaria.onerror = function () {
            finalizar(false);
        };

        sinal.addEventListener("abort", cancelar, { once: true });
        temporaria.src = url;
    });
}

async function carregarImagemComTentativas(imagem, enderecoOriginal, sinal) {
    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_IMAGEM; tentativa++) {
        if (sinal.aborted || !imagem.isConnected) {
            return;
        }

        const endereco = new URL(enderecoOriginal, window.location.href);

        if (tentativa > 1) {
            // Evita reutilizar uma resposta de erro armazenada no cache.
            endereco.searchParams.set("tentativaImagem", tentativa);
        }

        const carregou = await testarImagem(endereco.toString(), sinal);

        if (sinal.aborted || !imagem.isConnected) {
            return;
        }

        if (carregou) {
            imagem.src = endereco.toString();
            return;
        }

        if (tentativa < MAX_TENTATIVAS_IMAGEM) {
            try {
                await esperar(2000 * tentativa, sinal);
            } catch (erro) {
                return;
            }
        }
    }

    // Depois de quatro tentativas, mantém a ilustração local de reserva.
    imagem.alt = "Imagem do personagem indisponível";
    imagem.src = IMAGEM_RESERVA;
}

function processarFilaImagens() {
    while (imagensEmAndamento < MAX_IMAGENS_SIMULTANEAS && filaImagens.length > 0) {
        const tarefa = filaImagens.shift();

        if (tarefa.sinal.aborted || !tarefa.imagem.isConnected) {
            continue;
        }

        imagensEmAndamento++;

        carregarImagemComTentativas(tarefa.imagem, tarefa.endereco, tarefa.sinal)
            .catch(function (erro) {
                console.error("Falha ao carregar imagem:", erro);
            })
            .finally(function () {
                imagensEmAndamento--;
                processarFilaImagens();
            });
    }
}

function enfileirarImagem(imagem, sinal = controladorImagens.signal) {
    if (imagem.dataset.imagemNaFila === "sim") {
        return;
    }

    imagem.dataset.imagemNaFila = "sim";

    filaImagens.push({
        imagem: imagem,
        endereco: imagem.dataset.imagemOriginal,
        sinal: sinal
    });

    processarFilaImagens();
}

function prepararImagem(imagem, enderecoOriginal) {
    imagem.dataset.imagemOriginal = enderecoOriginal;
    imagem.src = IMAGEM_RESERVA;
}

function iniciarImagensDosCards() {
    const imagens = listaPersonagens.querySelectorAll(".card__imagem");

    if ("IntersectionObserver" in window) {
        const observador = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                if (entrada.isIntersecting) {
                    observador.unobserve(entrada.target);
                    enfileirarImagem(entrada.target);
                }
            });
        }, {
            rootMargin: "350px"
        });

        observadorImagens = observador;

        imagens.forEach(function (imagem) {
            observador.observe(imagem);
        });
    } else {
        // Compatibilidade com navegadores sem IntersectionObserver.
        imagens.forEach(function (imagem) {
            enfileirarImagem(imagem);
        });
    }
}

function interromperImagensAnteriores() {
    const sinalAnterior = controladorImagens.signal;
    controladorImagens.abort();
    controladorImagens = new AbortController();
    filaImagens = filaImagens.filter(function (tarefa) {
        return tarefa.sinal !== sinalAnterior;
    });

    if (observadorImagens) {
        observadorImagens.disconnect();
        observadorImagens = null;
    }
}

function criarCard(personagem) {
    const card = document.createElement("article");
    card.className = "card";

    const imagem = document.createElement("img");
    imagem.className = "card__imagem";
    imagem.alt = `Imagem de ${personagem.name}`;
    imagem.loading = "lazy";
    imagem.width = 300;
    imagem.height = 300;
    prepararImagem(imagem, personagem.image);

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
    botaoAnterior.disabled = requisicaoEmAndamento || paginaAtual <= 1;
    botaoProximo.disabled = requisicaoEmAndamento || paginaAtual >= totalPaginas;
}

function salvarPaginaNaURL() {
    const url = new URL(window.location.href);

    if (paginaAtual > 1) {
        url.searchParams.set("pagina", paginaAtual);
    } else {
        url.searchParams.delete("pagina");
    }

    if (nomeBuscado) {
        url.searchParams.set("nome", nomeBuscado);
    } else {
        url.searchParams.delete("nome");
    }

    window.history.replaceState(null, "", url.toString());
}

function exibirPersonagens(dados, pagina, nome) {
    interromperImagensAnteriores();

    const fragmento = document.createDocumentFragment();

    dados.results.forEach(function (personagem) {
        fragmento.appendChild(criarCard(personagem));
    });

    // Mantém os cards anteriores até receber uma resposta válida.
    listaPersonagens.replaceChildren(fragmento);
    iniciarImagensDosCards();

    paginaAtual = pagina;
    totalPaginas = dados.info.pages;
    nomeBuscado = nome;
    campoBusca.value = nome;
    mensagem.textContent = `${dados.info.count} personagem(ns) encontrado(s).`;
    salvarPaginaNaURL();
}

async function buscarComTempoLimite(url, sinal) {
    const controladorTentativa = new AbortController();

    function cancelar() {
        controladorTentativa.abort();
    }

    if (sinal.aborted) {
        cancelar();
    }

    sinal.addEventListener("abort", cancelar, { once: true });
    const temporizador = setTimeout(cancelar, TEMPO_LIMITE_API);

    try {
        return await fetch(url, { signal: controladorTentativa.signal });
    } finally {
        clearTimeout(temporizador);
        sinal.removeEventListener("abort", cancelar);
    }
}

async function consultarAPI(url, sinal, informarTentativa) {
    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_API; tentativa++) {
        if (sinal.aborted) {
            throw new DOMException("Requisição cancelada", "AbortError");
        }

        informarTentativa(tentativa);

        try {
            const resposta = await buscarComTempoLimite(url, sinal);
            const falhaTemporaria = resposta.status === 429 || resposta.status >= 500;

            if (!falhaTemporaria || tentativa === MAX_TENTATIVAS_API) {
                return resposta;
            }
        } catch (erro) {
            if (sinal.aborted || tentativa === MAX_TENTATIVAS_API) {
                throw erro;
            }
        }

        const intervalo = Math.min(1200 * (2 ** (tentativa - 1)), 6000);
        await esperar(intervalo, sinal);
    }
}

async function carregarPersonagens(pagina = 1, nome = "") {
    const requisicao = ++numeroRequisicao;

    if (controladorRequisicao) {
        controladorRequisicao.abort();
    }

    controladorRequisicao = new AbortController();
    const sinal = controladorRequisicao.signal;

    ultimaSolicitacao = { pagina, nome };
    requisicaoEmAndamento = true;
    avisoErro.hidden = true;
    mensagem.textContent = "Carregando personagens...";
    listaPersonagens.setAttribute("aria-busy", "true");
    atualizarPaginacao();

    const url = new URL(URL_API);
    url.searchParams.set("page", pagina);

    if (nome) {
        url.searchParams.set("name", nome);
    }

    const chaveCache = `${pagina}:${nome.toLowerCase()}`;

    try {
        let dados = cachePaginas.get(chaveCache);

        if (!dados) {
            const resposta = await consultarAPI(url.toString(), sinal, function (tentativa) {
                if (requisicao === numeroRequisicao && tentativa > 1) {
                    mensagem.textContent = `Conexão instável. Tentativa automática ${tentativa} de ${MAX_TENTATIVAS_API}...`;
                }
            });

            if (requisicao !== numeroRequisicao) {
                return;
            }

            if (resposta.status === 404 && pagina === 1) {
                interromperImagensAnteriores();
                listaPersonagens.replaceChildren();
                paginaAtual = 1;
                totalPaginas = 1;
                nomeBuscado = nome;
                campoBusca.value = nome;
                mensagem.textContent = "Nenhum personagem encontrado. Tente outro nome.";
                salvarPaginaNaURL();
                return;
            }

            if (!resposta.ok) {
                throw new Error(`Erro na API: ${resposta.status}`);
            }

            dados = await resposta.json();

            if (!dados.info || !Array.isArray(dados.results) || !Number.isInteger(dados.info.pages)) {
                throw new Error("A API retornou dados inesperados.");
            }

            cachePaginas.set(chaveCache, dados);
        }

        if (requisicao !== numeroRequisicao) {
            return;
        }

        exibirPersonagens(dados, pagina, nome);
    } catch (erro) {
        if (requisicao !== numeroRequisicao || sinal.aborted) {
            return;
        }

        console.error("Erro ao consultar a API:", erro);
        avisoErro.hidden = false;

        if (listaPersonagens.children.length > 0) {
            mensagem.textContent = "Não foi possível atualizar. Os personagens anteriores foram mantidos.";
        } else {
            mensagem.textContent = "Não foi possível carregar os personagens.";
        }
    } finally {
        if (requisicao === numeroRequisicao) {
            requisicaoEmAndamento = false;
            listaPersonagens.removeAttribute("aria-busy");
            atualizarPaginacao();
        }
    }
}

formularioBusca.addEventListener("submit", function (evento) {
    evento.preventDefault();
    carregarPersonagens(1, campoBusca.value.trim());
});

botaoAnterior.addEventListener("click", function () {
    if (!requisicaoEmAndamento && paginaAtual > 1) {
        carregarPersonagens(paginaAtual - 1, nomeBuscado);
    }
});

botaoProximo.addEventListener("click", function () {
    if (!requisicaoEmAndamento && paginaAtual < totalPaginas) {
        carregarPersonagens(paginaAtual + 1, nomeBuscado);
    }
});

botaoTentarNovamente.addEventListener("click", function () {
    if (!requisicaoEmAndamento) {
        carregarPersonagens(ultimaSolicitacao.pagina, ultimaSolicitacao.nome);
    }
});

// A mesma estratégia de repetição é usada nos três retratos do cabeçalho.
document.querySelectorAll(".retrato img").forEach(function (imagem) {
    if (imagem.complete && imagem.naturalWidth > 0) {
        return;
    }

    const enderecoOriginal = imagem.src;
    prepararImagem(imagem, enderecoOriginal);
    enfileirarImagem(imagem, controladorImagensHero.signal);
});

const parametrosIniciais = new URLSearchParams(window.location.search);
const paginaInicial = Number(parametrosIniciais.get("pagina"));
const nomeInicial = (parametrosIniciais.get("nome") || "").trim();

carregarPersonagens(
    Number.isInteger(paginaInicial) && paginaInicial > 0 ? paginaInicial : 1,
    nomeInicial
);
