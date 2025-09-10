// 🇲🇿 SERVIDOR DE NOTÍCIAS DE MOÇAMBIQUE — POWERED BY CLOUDFLARE WORKERS

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/noticias") {
      return handleNoticias();
    }

    // Habilita CORS pra seu site HTML
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    return new Response("Servidor de notícias ativo. Use /api/noticias", { status: 200 });
  },
};

async function handleNoticias() {
  const fontes = [
    { nome: "@Verdade", url: "https://www.verdade.co.mz/feed/", categoria: "Geral" },
    { nome: "Canal de Moçambique", url: "https://canaldemocambique.co.mz/feed/", categoria: "Política" },
    { nome: "O País", url: "https://opais.co.mz/feed/", categoria: "Economia" },
    { nome: "DW África", url: "https://rss.dw.com/xml/DW_Africa_Portuguese", categoria: "Internacional" },
    { nome: "LUSA", url: "https://www.lusa.pt/rss/", categoria: "Geral" }
  ];

  let todasNoticias = [];

  for (const fonte of fontes) {
    try {
      const response = await fetch(fonte.url);
      const xml = await response.text();
      const noticias = parseRSS(xml, fonte.nome, fonte.categoria);
      todasNoticias = [...todasNoticias, ...noticias];
    } catch (error) {
      console.log(`Erro ao buscar ${fonte.nome}:`, error.message);
    }
  }

  // Ordena por data — mais recente primeiro
  todasNoticias.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Retorna as 50 mais recentes
  return new Response(JSON.stringify(todasNoticias.slice(0, 50)), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function parseRSS(xml, fonte, categoria) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  const items = doc.querySelectorAll("item");
  const noticias = [];

  items.forEach(item => {
    const titulo = item.querySelector("title")?.textContent || "";
    const link = item.querySelector("link")?.textContent || item.querySelector("guid")?.textContent || "";
    const descricao = item.querySelector("description")?.textContent || "";
    const pubDate = item.querySelector("pubDate")?.textContent || new Date().toISOString();
    const imagem = extrairImagem(descricao) || extrairImagemFromEnclosure(item) || "";
    const audio = extrairAudioFromEnclosure(item) || "";
    const video = extrairVideoFromEnclosure(item) || "";

    // Só inclui se tiver título e link
    if (titulo && link) {
      noticias.push({
        titulo,
        link,
        descricao: limparHTML(descricao).substring(0, 300) + "...",
        pubDate,
        imagem,
        audio,
        video,
        fonte,
        categoria
      });
    }
  });

  return noticias;
}

function extrairImagem(html) {
  const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : "";
}

function extrairImagemFromEnclosure(item) {
  const enclosure = item.querySelector("enclosure");
  if (enclosure && enclosure.getAttribute("type")?.startsWith("image/")) {
    return enclosure.getAttribute("url");
  }
  return "";
}

function extrairAudioFromEnclosure(item) {
  const enclosure = item.querySelector("enclosure");
  if (enclosure && enclosure.getAttribute("type")?.startsWith("audio/")) {
    return enclosure.getAttribute("url");
  }
  return "";
}

function extrairVideoFromEnclosure(item) {
  const enclosure = item.querySelector("enclosure");
  if (enclosure && enclosure.getAttribute("type")?.startsWith("video/")) {
    return enclosure.getAttribute("url");
  }
  return "";
}

function limparHTML(html) {
  return html.replace(/<[^>]*>?/gm, '');
}
