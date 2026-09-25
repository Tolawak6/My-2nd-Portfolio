/**
 * Handlers that receive raw request bodies, validate them, and hand clean data
 * to the service layer. Keeping validation here means controllers stay thin
 * and the same rules apply no matter which route is called.
 */
import * as projectService from '../services/project.service.js';
import { validateProjectPayload } from '../validators/project.validator.js';


export async function listProjects(req, res) {
  const projects = await projectService.findAll();
  res.status(200).json({
    data: projects,
    meta: { count: projects.length },
  });
}

export async function getProject(req, res) {
  const project = await projectService.findById(req.params.id);
  if (!project) {
    return res.status(404).json({
      error: { message: `Project ${req.params.id} was not found.`, status: 404 },
    });
  }
  return res.status(200).json({ data: project });
}

export async function createProject(req, res) {
  const { value, errors } = validateProjectPayload(req.body);
  if (errors.length > 0) {
    return res.status(422).json({
      error: {
        message: 'The submitted project data is not valid.',
        status: 422,
        details: errors,
      },
    });
  }

  const project = await projectService.create(value);
  return res.status(201).json({ data: project });
}

export async function updateProject(req, res) {
  const { value, errors } = validateProjectPayload(req.body);
  if (errors.length > 0) {
    return res.status(422).json({
      error: {
        message: 'The submitted project data is not valid.',
        status: 422,
        details: errors,
      },
    });
  }

  const project = await projectService.update(req.params.id, value);
  if (!project) {
    return res.status(404).json({
      error: { message: `Project ${req.params.id} was not found.`, status: 404 },
    });
  }
  return res.status(200).json({ data: project });
}

export async function deleteProject(req, res) {
  const removed = await projectService.remove(req.params.id);
  if (!removed) {
    return res.status(404).json({
      error: { message: `Project ${req.params.id} was not found.`, status: 404 },
    });
  }
  return res.status(204).send();
}
