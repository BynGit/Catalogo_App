// Simple fetch a Google Sheets sin API Key

export const prerender = false;

export async function GET({ url }) {
  const SHEET_CSV_URL = import.meta.env.GOOGLE_SHEET_CSV_URL;

  if (!SHEET_CSV_URL) {
    return new Response(
      JSON.stringify({ error: "GOOGLE_SHEET_CSV_URL no configurada en .env" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error(`Error: ${response.status}`);

    const csv = await response.text();
    const rows = csv.split("\n").filter((row) => row.trim());

    // Mapea CSV a objetos
    const products = rows.slice(1).map((row) => {
      const [idProducto, nombre, imagen, categoria, precio] = row
        .split(",")
        .map((v) => v.trim());
      return {idProducto, nombre, imagen, categoria, precio };
    });

    // console.log("Productos obtenidos:", products);

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // console.error("Error al obtener productos:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },

    });
  }
}
