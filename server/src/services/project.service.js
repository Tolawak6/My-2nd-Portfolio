/**
 * The project data access layer.
 *
 * Every statement here is parameterised ($1, $2, ...) so user supplied values
 * can never be interpreted as SQL. This is the only file that talks to the
 * `projects` table.
 */
import { query } from '../db/pool.js';

/** Columns returned to API consumers. Keeps `SELECT *` out of the codebase. */
const PROJECT_COLUMNS = `
  id,
  name,
  image,
  link,
  description,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export async function findAll() {
  const { rows } = await query(
    `SELECT ${PROJECT_COLUMNS} FROM projects ORDER BY created_at DESC, id DESC`,
  );
  return rows;
}

export async function findById(id) {
  const { rows } = await query(
    `SELECT ${PROJECT_COLUMNS} FROM projects WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function create({ name, image, link, description }) {
  const { rows } = await query(
    `INSERT INTO projects (name, image, link, description)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PROJECT_COLUMNS}`,
    [name, image, link, description],
  );
  return rows[0];
}

/**
 * Updates a project and returns the new row, or null when no such id exists.
 * `updated_at` is maintained by the projects_set_updated_at trigger.
 */
export async function update(id, { name, image, link, description }) {
  const { rows } = await query(
    `UPDATE projects
        SET name = $2,
            image = $3,
            link = $4,
            description = $5
      WHERE id = $1
      RETURNING ${PROJECT_COLUMNS}`,
    [id, name, image, link, description],
  );
  return rows[0] ?? null;
}

/** Returns true when a row was removed. */
export async function remove(id) {
  const { rowCount } = await query('DELETE FROM projects WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function count() {
  const { rows } = await query('SELECT COUNT(*)::int AS total FROM projects');
  return rows[0]?.total ?? 0;
}
