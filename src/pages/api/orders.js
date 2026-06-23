// Permitir POST en este endpoint
export const prerender = false;

// Endpoint para procesar pedidos y enviar a Google Sheets (Hoja Compras)
export async function POST({ request }) {
  try {
    console.log("=== INICIANDO PROCESAMIENTO DE PEDIDO ===");

    // Validar el body de la solicitud
    const body = await request.text();
    console.log("1. Body recibido:", body.substring(0, 100) + "...");

    if (!body) {
      console.error("Body está vacío");
      return new Response(JSON.stringify({ error: "Body vacío" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("2. Parseando JSON...");
    let data;
    try {
      data = JSON.parse(body);
      console.log("3. JSON parseado correctamente");
    } catch (parseError) {
      console.error("3. Error al parsear JSON:", parseError.message);
      return new Response(
        JSON.stringify({ error: "JSON inválido: " + parseError.message }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { customerName, customerPhone, products } = data;

    console.log("4. Datos extraídos:", {
      customerName,
      customerPhone,
      productsCount: products?.length,
    });

    // Validar datos
    if (!customerName || !customerPhone || !products || products.length === 0) {
      console.error("4. Validación fallida", {
        customerName,
        customerPhone,
        productsLength: products?.length,
      });
      return new Response(
        JSON.stringify({
          error: "Datos incompletos",
          details: {
            customerName,
            customerPhone,
            productsLength: products?.length,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log("5. Obteniendo WEBHOOK_URL...");
    const WEBHOOK_URL = import.meta.env.GOOGLE_SHEET_WEBHOOK_URL;

    console.log(
      "6. WEBHOOK_URL:",
      WEBHOOK_URL ? "✓ Configurada" : "✗ NO CONFIGURADA",
    );

    if (!WEBHOOK_URL) {
      console.error("6. WEBHOOK_URL no está configurada en .env");
      return new Response(
        JSON.stringify({
          error: "GOOGLE_SHEET_WEBHOOK_URL no configurada en .env",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log("7. Procesando", products.length, "productos...");

    // Procesar cada producto - crear una fila por cada uno
    const results = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(
        `   [${i + 1}/${products.length}] Producto: ${product.nombre}`,
      );

      const orderData = {
        customerName,
        customerPhone,
        productId: product.idProducto,
        productName: product.nombre,
        productCategory: product.categoria,
        productPrice: product.precio,
        timestamp: new Date().toLocaleString("es-CO"),
      };

      try {
        console.log(`   [${i + 1}] Enviando a webhook...`);

        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        });

        const responseText = await response.text();
        console.log(
          `   [${i + 1}] Respuesta: Status ${response.status}, Body: ${responseText.substring(0, 50)}`,
        );

        if (response.ok) {
          results.push({ product: product.nombre, status: "success" });
        } else {
          console.error(`   [${i + 1}] Error: Status ${response.status}`);
          results.push({
            product: product.nombre,
            status: "error",
            statusCode: response.status,
          });
        }
      } catch (error) {
        console.error(`   [${i + 1}] Error en fetch:`, error.message);
        results.push({
          product: product.nombre,
          status: "error",
          error: error.message,
        });
      }
    }

    console.log("8. Procesamiento completado");
    console.log("   Resultados:", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pedido procesado",
        orderedProducts: products.length,
        results: results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("=== ERROR CRÍTICO ===");
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
    return new Response(
      JSON.stringify({ error: error.message || "Error al procesar el pedido" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
