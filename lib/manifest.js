/* ============================================================================
   manifest.js — DATOS DE LA MARCA
   ----------------------------------------------------------------------------
   Este es el ÚNICO archivo que cambias cuando vendes el sitio a otro cliente.
   Nombre, teléfono, dirección, horarios y redes salen todos de aquí.

   En la fase 2 (panel de administración) este objeto deja de ser un archivo
   y pasa a ser una fila de la tabla `negocios` en la base de datos.
   Mira LEEME.md → "Puente a la fase 2".
   ========================================================================== */
(function () {
  "use strict";

  window.__BRAND__ = {
    nombre: "Casa Roble",
    lema: "Cocina de mercado",
    desde: "2019",

    contacto: {
      telefono: "+507 6000 0000",
      telefonoLink: "+50760000000",
      whatsapp: "50760000000",
      email: "hola@casaroble.example",
      direccion: "Av. Central 118, Casco Antiguo",
      ciudad: "Ciudad de Panamá"
    },

    horarios: [
      { dias: "Martes a jueves", diasNum: [2, 3, 4], horas: "12:00 – 15:30 · 18:30 – 22:30" },
      { dias: "Viernes y sábado", diasNum: [5, 6], horas: "12:00 – 16:00 · 18:30 – 23:30" },
      { dias: "Domingo", diasNum: [0], horas: "12:00 – 17:00" },
      { dias: "Lunes", diasNum: [1], horas: "Cerrado" }
    ],

    redes: [
      { nombre: "Instagram", url: "#" },
      { nombre: "Facebook", url: "#" },
      { nombre: "Google Maps", url: "#" }
    ]
  };
})();
