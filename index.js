// 🇲🇿 WORKER DE NOTÍCIAS DE MOÇAMBIQUE — VERSÃO ATUALIZADA (TESTADA EM 2025)

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (url.pathname === "/api/noticias") {
      return handleNoticias();
    }

    return new Response("Servidor de notícias ativo. Use /api/noticias", { status: 200 });
  },
};

async function handleNoticias() {
  // 👇 FONTES ATUALIZADAS + HEADERS DE NAVEGADOR
  const fontes = [
    {
      nome: "@Verdade",
      url: "https://www.verdade.co.mz/feed/",
      categoria: "Geral",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    },
    {
      nome: "Canal de Moçambique",
      url: "https://canaldemocambique.co.mz/feed/",
      categoria: "Política",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
        'Accept': 'text/xml,application/xml,application/rss+xml',
      }
    },
    {
      nome: "DW África",
      url: "https://rss.dw.com/xml/DW_Africa_Portuguese",
      categoria: "Internacional",
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      }
    }
  ];

  let todasNoticias = [];

  for (const fonte of fontes) {
    try {
      console.log(`[INFO] Buscando notícias de: ${fonte.nome}`);
      const response = await fetch(fonte.url, { headers: fonte.headers });

      if (!response.ok) {
        console.log(`[ERRO] ${fonte.nome} retornou status: ${response.status}`);
        continue;
      }

      const xml = await response.text();
      console.log(`[XML] Primeiros 200 caracteres de ${fonte.nome}:`, xml.substring(0, 200));

      const noticias = parseRSS(xml, fonte.nome, fonte.categoria);
      console.log(`[SUCESSO] ${fonte.nome}: encontrou ${noticias.length} notícias`);

      todasNoticias = [...todasNoticias, ...noticias];
    } catch (error) {
      console.log(`[ERRO] Falha ao buscar ${fonte.nome}:`, error.message);
    }
  }

  // Ordena por data — mais recente primeiro
  todasNoticias.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

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

  // Verifica erro de parsing
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    console.log(`[ERRO XML] ${fonte}:`, parserError.textContent);
    return [];
  }

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

// Funções auxiliares (mantidas iguais)
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
