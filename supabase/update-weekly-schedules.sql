-- Run manually in Supabase SQL Editor after reviewing this plan.
-- Two fixed weekly sessions per active course. No schema or RLS changes.
-- Existing aula/docente values are preserved. No schedules are deleted.
-- Supports 1-10 available courses per career/semester; enrollment is optional.
-- Keep every operation inside one statement, including temporary table usage.
DO $weekly_schedule$
BEGIN

LOCK TABLE public.cursos IN SHARE MODE;
LOCK TABLE public.horarios IN SHARE ROW EXCLUSIVE MODE;

  IF NOT EXISTS (SELECT 1 FROM public.cursos WHERE activo IS TRUE) THEN
    RAISE EXCEPTION 'No hay cursos activos. No se modificaron horarios.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.cursos
    WHERE activo IS TRUE
      AND (carrera IS NULL OR btrim(carrera) = '' OR ciclo IS NULL OR ciclo NOT BETWEEN 1 AND 10)
  ) THEN
    RAISE EXCEPTION 'Hay cursos activos sin carrera o con semestre inválido. Revisa el catálogo antes de continuar.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.cursos WHERE activo IS TRUE
    GROUP BY carrera, ciclo HAVING count(*) > 10
  ) THEN
    RAISE EXCEPTION 'Hay una carrera y semestre con más de diez cursos activos. Esta plantilla admite hasta diez sin cruces entre 08:00 y 14:00. Revisa el catálogo antes de continuar; no es un requisito de matrícula del alumno.';
  END IF;
  IF EXISTS (
    SELECT h.curso_id FROM public.horarios h
    JOIN public.cursos c ON c.id = h.curso_id AND c.activo IS TRUE
    GROUP BY h.curso_id HAVING count(*) > 2
  ) THEN
    RAISE EXCEPTION 'Hay cursos con más de dos sesiones. Revisa sus horarios antes de aplicar esta plantilla; no se eliminarán datos.';
  END IF;
CREATE TEMP TABLE weekly_schedule_targets ON COMMIT DROP AS
WITH ranked_courses AS (
  SELECT id AS curso_id,
    row_number() OVER (PARTITION BY carrera, ciclo ORDER BY codigo NULLS LAST, id) AS course_position
  FROM public.cursos WHERE activo IS TRUE
), template(course_position, session_position, dia_semana, hora_inicio, hora_fin) AS (
  VALUES
    (1, 1, 1, TIME '08:00', TIME '10:00'),
    (1, 2, 4, TIME '11:00', TIME '13:00'),
    (2, 1, 1, TIME '10:00', TIME '12:00'),
    (2, 2, 3, TIME '08:00', TIME '10:00'),
    (3, 1, 2, TIME '08:00', TIME '10:00'),
    (3, 2, 5, TIME '10:00', TIME '12:00'),
    (4, 1, 2, TIME '10:00', TIME '12:00'),
    (4, 2, 4, TIME '08:00', TIME '10:00'),
    (5, 1, 3, TIME '11:00', TIME '13:00'),
    (5, 2, 5, TIME '12:00', TIME '14:00'),
    (6, 1, 1, TIME '12:00', TIME '13:00'),
    (6, 2, 2, TIME '12:00', TIME '13:00'),
    (7, 1, 1, TIME '13:00', TIME '14:00'),
    (7, 2, 2, TIME '13:00', TIME '14:00'),
    (8, 1, 3, TIME '10:00', TIME '11:00'),
    (8, 2, 4, TIME '10:00', TIME '11:00'),
    (9, 1, 3, TIME '13:00', TIME '14:00'),
    (9, 2, 5, TIME '08:00', TIME '09:00'),
    (10, 1, 4, TIME '13:00', TIME '14:00'),
    (10, 2, 5, TIME '09:00', TIME '10:00')
)
SELECT c.curso_id, t.session_position, t.dia_semana, t.hora_inicio, t.hora_fin
FROM ranked_courses c JOIN template t USING (course_position);

CREATE TEMP TABLE previous_weekly_schedules ON COMMIT DROP AS
SELECT h.*,
  row_number() OVER (PARTITION BY h.curso_id ORDER BY h.dia_semana, h.hora_inicio, h.id) AS session_position
FROM public.horarios h JOIN public.cursos c ON c.id = h.curso_id
WHERE c.activo IS TRUE;

UPDATE public.horarios h
SET dia_semana = t.dia_semana, hora_inicio = t.hora_inicio, hora_fin = t.hora_fin
FROM weekly_schedule_targets t
JOIN previous_weekly_schedules p USING (curso_id, session_position)
WHERE h.id = p.id;

INSERT INTO public.horarios (id, curso_id, dia_semana, hora_inicio, hora_fin, aula, docente)
SELECT gen_random_uuid(), t.curso_id, t.dia_semana, t.hora_inicio, t.hora_fin, first_session.aula, first_session.docente
FROM weekly_schedule_targets t
LEFT JOIN previous_weekly_schedules p USING (curso_id, session_position)
LEFT JOIN previous_weekly_schedules first_session
  ON first_session.curso_id = t.curso_id AND first_session.session_position = 1
WHERE p.id IS NULL;

-- A failed validation rolls back all changes made by this block.
  IF (SELECT count(*) FROM weekly_schedule_targets) <> 2 * (SELECT count(*) FROM public.cursos WHERE activo IS TRUE) THEN
    RAISE EXCEPTION 'La plantilla no cubre todos los cursos activos. Se cancela la actualización.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.horarios h JOIN public.cursos c ON c.id = h.curso_id
    WHERE c.activo IS TRUE
    GROUP BY h.curso_id HAVING count(*) <> 2
  ) THEN
    RAISE EXCEPTION 'El horario no contiene exactamente dos sesiones por curso.';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.horarios a
    JOIN public.horarios b ON a.id < b.id AND a.dia_semana = b.dia_semana
      AND a.hora_inicio < b.hora_fin AND b.hora_inicio < a.hora_fin
    JOIN public.cursos ca ON ca.id = a.curso_id AND ca.activo IS TRUE
    JOIN public.cursos cb ON cb.id = b.curso_id AND cb.activo IS TRUE
      AND ca.carrera = cb.carrera AND ca.ciclo = cb.ciclo
  ) THEN
    RAISE EXCEPTION 'Se detectaron cruces de horario. Se cancela la actualización.';
  END IF;
END $weekly_schedule$;

SELECT c.carrera, c.ciclo, c.codigo, c.nombre, h.dia_semana, h.hora_inicio, h.hora_fin
FROM public.cursos c JOIN public.horarios h ON h.curso_id = c.id
WHERE c.activo IS TRUE
ORDER BY c.carrera, c.ciclo, c.codigo, h.dia_semana, h.hora_inicio;
