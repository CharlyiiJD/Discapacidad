# Lectura asistida

El panel y la voz estan desactivados inicialmente. **Alt + Shift + L** sigue este ciclo:

1. Abre el panel, activa la voz y enfoca el boton Activar lectura asistida, cuyo estado es activado.
2. Cierra el panel y mantiene la voz activada.
3. Desactiva la voz sin abrir el panel.
4. Abre el panel y activa la voz nuevamente.

Tab y Shift + Tab recorren los controles y anuncian sus nombres y estados. El icono lateral abre el panel para ajustar la lectura incluso si la voz ya estaba activa. Escape cierra el panel sin desactivar la voz y devuelve el foco al elemento anterior.

Activar, desactivar, leer una seccion, pausar, reanudar o detener la voz cierra automaticamente el panel. Para modificar la velocidad (0.5 a 2), vuelve a abrirlo y usa las flechas del deslizador. El panel conserva el foco dentro mientras esta abierto.

No hay barras de controles en la pagina ni controles incrustados en login o registro. El atajo permite abrir el panel independiente incluso desde un formulario modal. Al cerrar el panel, ese formulario permanece abierto.

## Prueba manual

1. Abre Servicios. No debe sonar nada al cargar.
2. Pulsa Alt + Shift + L. El panel debe abrirse con la voz activada y el foco en Activar lectura asistida. No hace falta pulsar Enter para activar la voz.
3. Recorre los controles del panel con Tab y Shift + Tab y escucha sus etiquetas y estados. Prueba las tres pulsaciones siguientes del atajo: cerrar manteniendo la voz, desactivar sin abrir, abrir y activar nuevamente. No debe leerse cada caracter escrito en los formularios.
4. Vuelve a abrir el panel, selecciona Leer seccion y comprueba que se lee el contenido, no los controles del panel.
5. Prueba pausar, reanudar, detener y cambiar velocidad. Se pueden anunciar los controles mientras un contenido esta pausado sin eliminarlo; al reanudar despues de esos anuncios puede repetirse el bloque de texto que estaba pausado.
6. Abre login o registro: no debe haber controles de voz dentro. Desde un campo, abre el panel con el atajo y pulsa Escape: el campo debe recuperar el foco.
7. Prueba los errores de registro y las confirmaciones de matricula y notas. Las regiones de estado deben anunciarse sin repetirse por cada actualizacion visual.
8. Con una cuenta de estudiante, escucha cursos y notas reales. En la nueva pestana del portal activa la lectura nuevamente. Nunca debe leerse una contrasena, aunque se pulse Mostrar.
9. Desactiva la lectura integrada antes de probar con NVDA. No debe haber voz integrada mientras esta desactivada.

## Comprobaciones automatizadas

Con el servidor local en marcha:

```sh
npm run build
node scripts/check-speech-reader.mjs
```

El script usa Playwright y Edge, prueba escritorio y movil, simula la sintesis de voz y evita consultas reales a Supabase. Para otro puerto, establece TEST_BASE_URL. La simulacion no comprueba la calidad del audio ni sustituye pruebas manuales con NVDA.

## Limites

- Las voces dependen del navegador y del sistema. Se prefiere es-PE y se usa otra voz espanola disponible si falta. Se atiende voiceschanged para voces que llegan despues de cargar.
- Cada pestana comienza con la lectura desactivada y exige una accion del usuario; solo se guarda la velocidad.
- Algunas voces requieren red y pueden procesar el contenido mediante el proveedor del navegador. No se garantiza funcionamiento sin conexion.
- El navegador o la tecnologia de asistencia puede reservar el atajo. El boton lateral es la alternativa; en macOS, Alt corresponde a Option.
- Esto lee contenido dentro de la aplicacion. No sustituye un lector del sistema ni demuestra por si solo conformidad WCAG.

La compilacion y las pruebas de navegador deben ejecutarse antes de publicar. No se han dado por aprobadas si el entorno impide ejecutarlas.
