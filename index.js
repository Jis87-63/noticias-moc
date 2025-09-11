// ================== BUSCA POR NOME (SEM CHAVE — API PÚBLICA) ==================
async function handleSearch(query) {
  try {
    // Usa API pública alternativa (sem chave)
    const apiUrl = `https://ytsearch.vercel.app/api/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.videos && data.videos.length > 0) {
      const results = data.videos
        .filter(v => v.title && v.url)
        .slice(0, 20)
        .map(v => ({
          title: v.title,
          url: v.url,
          thumbnail: v.thumbnail || "",
          duration: v.duration || "",
          views: v.views || "",
          channel: v.author?.name || ""
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
