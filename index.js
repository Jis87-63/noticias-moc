// 🎵 TUBEFOLLOW — BAIXADOR DE MÚSICAS E VÍDEOS (YOUTUBE, TIKTOK, INSTAGRAM, FACEBOOK)

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

    if (url.pathname === "/api/search") {
      const query = url.searchParams.get('q');
      if (!query) {
        return new Response(JSON.stringify({ error: "Parâmetro 'q' é obrigatório" }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      return handleSearch(query);
    }

    if (url.pathname === "/api/download") {
      const videoUrl = url.searchParams.get('url');
      const format = url.searchParams.get('format') || 'mp3';
      if (!videoUrl) {
        return new Response(JSON.stringify({ error: "Parâmetro 'url' é obrigatório" }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      return handleDownload(videoUrl, format);
    }

    return new Response("Servidor TubeFllow ativo. Use /api/search ou /api/download", { status: 200 });
  },
};

// ================== BUSCA POR NOME (YOUTUBE) ==================
async function handleSearch(query) {
  try {
    // Usa API pública do YouTube (via RapidAPI)
    const apiUrl = `https://youtube-search-results.p.rapidapi.com/youtube-search/?q=${encodeURIComponent(query)}`;
    const response = await fetch(apiUrl, {
      headers: {
        'X-RapidAPI-Key': 'SUA_CHAVE_AQUI', // Cadastre grátis em rapidapi.com
        'X-RapidAPI-Host': 'youtube-search-results.p.rapidapi.com'
      }
    });

    const data = await response.json();

    if (data.videos && data.videos.length > 0) {
      const results = data.videos
        .filter(v => v.type === "video" && v.title && v.videoId)
        .slice(0, 20)
        .map(v => ({
          title: v.title,
          url: `https://www.youtube.com/watch?v=${v.videoId}`,
          thumbnail: v.thumbnails?.[0]?.url || "",
          duration: v.duration?.text || "",
          views: v.views?.text || "",
          channel: v.channel?.name || ""
        }));

      return new Response(JSON.stringify(results), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    throw new Error("Nenhum resultado encontrado");
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro ao buscar: " + error.message }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 500
    });
  }
}

// ================== DOWNLOAD OU STREAM ==================
async function handleDownload(videoUrl, format) {
  try {
    // Usa serviço público (ex: ytpp3.com)
    const apiUrl = `https://ytpp3.com/api/?url=${encodeURIComponent(videoUrl)}&format=${format}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.success) {
      return new Response(JSON.stringify({
        success: true,
        title: data.title || "",
        thumbnail: data.thumbnail || "",
        audio_url: data.audio?.url || "",
        video_url: data.video?.url || "",
        duration: data.duration || "",
        views: data.views || ""
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    throw new Error(data.error || "Não foi possível processar");
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro ao processar: " + error.message }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 500
    });
  }
}
