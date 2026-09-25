import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Alert } from '../ui/Alert.jsx';
import { Icon } from '../ui/Icon.jsx';
import { ApiError } from '../../services/api.js';

const EMPTY = { name: '', image: '', link: '', description: '' };

/** Mirrors the API validation rules so mistakes are caught before a round trip. */
function validate(values) {
  const errors = {};

  const name = values.name.trim();
  if (!name) errors.name = 'Project name is required.';
  else if (name.length > 150) errors.name = 'Keep the name under 150 characters.';

  const description = values.description.trim();
  if (!description) errors.description = 'Description is required.';
  else if (description.length > 2000) errors.description = 'Keep the description under 2000 characters.';

  const image = values.image.trim();
  if (image && !isUrlLike(image)) {
    errors.image = 'Use a full URL (https://…) or a path starting with "/".';
  }

  const link = values.link.trim();
  if (link && !isUrlLike(link)) {
    errors.link = 'Use a full URL (https://…) or a path starting with "/".';
  }

  return errors;
}

function isUrlLike(value) {
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Add / edit form for a project.
 *
 * The same component handles both modes so the fields, validation and layout
 * can never drift apart. `project` is null when adding.
 */
export function ProjectForm({ project = null, onSubmit, onCancel, busy = false, submitError = null }) {
  const uid = useId();
  const isEditing = Boolean(project);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [previewFailed, setPreviewFailed] = useState(false);
  const nameRef = useRef(null);

  // Load the project being edited, or reset to blank when switching to "add".
  useEffect(() => {
    setValues(
      project
        ? {
            name: project.name ?? '',
            image: project.image ?? '',
            link: project.link ?? '',
            description: project.description ?? '',
          }
        : EMPTY,
    );
    setErrors({});
    setPreviewFailed(false);
  }, [project]);

  // Server-side 422 detail maps back onto the fields.
  useEffect(() => {
    if (submitError instanceof ApiError && Object.keys(submitError.fieldErrors).length > 0) {
      setErrors(submitError.fieldErrors);
    }
  }, [submitError]);

  const fieldId = (field) => `${uid}-${field}`;
  const errorId = (field) => `${uid}-${field}-error`;

  const update = (field) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
    if (field === 'image') setPreviewFailed(false);
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const first = Object.keys(nextErrors)[0];
      document.getElementById(fieldId(first))?.focus();
      return;
    }

    const payload = {
      name: values.name.trim(),
      image: values.image.trim(),
      link: values.link.trim(),
      description: values.description.trim(),
    };

    const succeeded = await onSubmit(payload);
    if (succeeded && !isEditing) {
      // Clear the form after a successful add so several projects can be
      // entered in a row without manually emptying every field.
      setValues(EMPTY);
      setErrors({});
      nameRef.current?.focus();
    }
  }

  const previewUrl = values.image.trim();

  return (
    <form className="project-form" onSubmit={handleSubmit} noValidate>
      <div className="project-form__head">
        <h3 className="project-form__title">
          {isEditing ? `Edit “${project.name}”` : 'Add a project'}
        </h3>
        <p className="project-form__subtitle">
          {isEditing
            ? 'Changes are saved to PostgreSQL and appear on the portfolio immediately.'
            : 'The project is stored in PostgreSQL and appears on the portfolio straight away.'}
        </p>
      </div>

      <div className="form-grid form-grid--two">
        <div className="field">
          <label className="field__label" htmlFor={fieldId('name')}>
            Project name
          </label>
          <input
            ref={nameRef}
            id={fieldId('name')}
            className={`input ${errors.name ? 'input--invalid' : ''}`.trim()}
            value={values.name}
            onChange={update('name')}
            maxLength={150}
            required
            disabled={busy}
            aria-invalid={errors.name ? 'true' : undefined}
            aria-describedby={errors.name ? errorId('name') : undefined}
          />
          {errors.name && (
            <p className="field__error" id={errorId('name')}>
              <Icon name="alert" size={13} />
              {errors.name}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fieldId('link')}>
            Project URL
            <span className="field__optional">Optional</span>
          </label>
          <input
            id={fieldId('link')}
            className={`input ${errors.link ? 'input--invalid' : ''}`.trim()}
            value={values.link}
            onChange={update('link')}
            placeholder="https://github.com/you/project"
            inputMode="url"
            disabled={busy}
            aria-invalid={errors.link ? 'true' : undefined}
            aria-describedby={errors.link ? errorId('link') : undefined}
          />
          {errors.link && (
            <p className="field__error" id={errorId('link')}>
              <Icon name="alert" size={13} />
              {errors.link}
            </p>
          )}
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={fieldId('image')}>
          Image URL
          <span className="field__optional">Optional</span>
        </label>
        <input
          id={fieldId('image')}
          className={`input ${errors.image ? 'input--invalid' : ''}`.trim()}
          value={values.image}
          onChange={update('image')}
          placeholder="https://… or /images/projects/my-project.png"
          inputMode="url"
          disabled={busy}
          aria-invalid={errors.image ? 'true' : undefined}
          aria-describedby={errors.image ? errorId('image') : `${fieldId('image')}-hint`}
        />
        {errors.image ? (
          <p className="field__error" id={errorId('image')}>
            <Icon name="alert" size={13} />
            {errors.image}
          </p>
        ) : (
          <p className="field__hint" id={`${fieldId('image')}-hint`}>
            Leave empty and the card shows a clean placeholder instead of a broken image.
          </p>
        )}

        {previewUrl && !errors.image && (
          <div className="project-form__preview">
            <span className="project-form__preview-label">Preview</span>
            {previewFailed ? (
              <p className="project-form__preview-failed">
                <Icon name="alert" size={13} />
                That image could not be loaded. Check the URL.
              </p>
            ) : (
              <img
                src={previewUrl}
                alt=""
                className="project-form__preview-img"
                onError={() => setPreviewFailed(true)}
              />
            )}
          </div>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={fieldId('description')}>
          Description
        </label>
        <textarea
          id={fieldId('description')}
          className={`textarea ${errors.description ? 'textarea--invalid' : ''}`.trim()}
          value={values.description}
          onChange={update('description')}
          rows={4}
          maxLength={2000}
          required
          disabled={busy}
          aria-invalid={errors.description ? 'true' : undefined}
          aria-describedby={errors.description ? errorId('description') : undefined}
        />
        {errors.description && (
          <p className="field__error" id={errorId('description')}>
            <Icon name="alert" size={13} />
            {errors.description}
          </p>
        )}
      </div>

      {submitError && !(submitError instanceof ApiError && Object.keys(submitError.fieldErrors).length) && (
        <Alert variant="error" title="Could not save the project">
          <p>{submitError.message}</p>
        </Alert>
      )}

      <div className="form-actions">
        <Button
          variant="primary"
          type="submit"
          loading={busy}
          icon={<Icon name={isEditing ? 'check' : 'plus'} size={16} />}
        >
          {busy ? 'Saving…' : isEditing ? 'Save changes' : 'Add project'}
        </Button>
        {isEditing && (
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export default ProjectForm;
