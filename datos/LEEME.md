# Pauteca · Estructura de datos (versión 1)

La aplicación (`index.html`, `estilos.css`, `app.js`) no contiene contenido educativo.
Todo el contenido vive en `datos/` y se carga bajo demanda:

```
datos/catalogo.json                       asignaturas (orden de la rueda), colores, iconos, activas, rango de años
datos/<asignatura>/temario.json           temas y tipos de ejercicio
datos/<asignatura>/formatos.json          texto explicativo del formato de examen (por año/convocatoria)
datos/<asignatura>/indice.json            lista de exámenes + id y clasificación de cada ejercicio (ligero)
datos/<asignatura>/examenes/AAAA-conv.json   enunciados y soluciones de un examen
```

Asignaturas: `ccss`, `matematicas`, `fisica`, `quimica`, `ciencias-generales`.

## Cuándo se carga cada cosa
- Al abrir la app: solo `catalogo.json`.
- Al entrar en una asignatura: su `temario.json`, `formatos.json` e `indice.json`.
- Al abrir un examen o una pestaña: solo ese archivo de `examenes/`.

## Identificadores estables
- Examen: `<asignatura>-<año>-<convocatoria>` → `ccss-2025-junio`, `matematicas-2024-reserva-1`.
- Ejercicio: `<id examen>-<número>` → `ccss-2025-junio-1`, `quimica-2024-julio-b1`.
Los ids no dependen del orden ni del texto: no cambian aunque se corrija un enunciado.

## Ejercicio
```json
{
 "id": "ccss-2025-junio-1",
 "n": 1,                    // número del examen (número o texto: 1, "2A", "B3")
 "num": 1,                  // opcional: número que se muestra si difiere de n
 "bloque": "A",
 "puntos": "2,5",
 "enunciado": { "intro": "html", "apartados": ["html", "..."] },
 "solucion": [ { "titulo": "Apartado a", "html": "..." } ],
 "clasificacion": [ { "tema": "matrices", "tipo": "ctx", "apartados": "a" } ],
 "origen": { "documento": null },
 "dificultad": null,
 "etiquetas": [],
 "revision": "revisado"
}
```
- La clasificación es **por apartado**: un ejercicio puede estar en varios temas y tipos.
  Debe coincidir en `indice.json` y en el archivo del examen.
- `tema` y `tipo` son los `id` de `temario.json`.
- HTML de soluciones: `<div class='ex'>`, `<i class='n' data-t='why|th|err|tp'>` (bocadillos),
  `<div class='tip th|tp|...'>`, `<div class='res'>`, LaTeX con `\( \)` y `\[ \]`, gráficas en SVG
  (las `polyline` dentro de `.sol` se suavizan solas).

## Orden de las convocatorias
Lo calcula la app: Junio, Julio, Septiembre, Reservas (por número), Modelo, Ponencia.

## Añadir un examen
1. Crear `datos/<asignatura>/examenes/AAAA-conv.json`.
2. Añadir su entrada (id, anio, convocatoria, archivo, ejercicios con id/n/clasificacion) a `indice.json`.
No hace falta tocar `app.js` ni `index.html`.
