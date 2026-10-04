import { useId } from "react";
import Image from "../../components/common/Image";
import { moveItem, validImageUrl } from "../content.js";
import s from "../styles/Admin.module.css";
export function Field({
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  options,
  ...props
}) {
  const id = useId();
  const shared = {
    ...props,
    id,
    value: value ?? "",
    onChange: (event) =>
      onChange(type === "checkbox" ? event.target.checked : event.target.value),
    "aria-invalid": Boolean(error),
    "aria-describedby": error || hint ? `${id}-help` : undefined,
  };
  return (
    <div className={type === "checkbox" ? s.check : s.field}>
      <label htmlFor={id}>{label}</label>
      {options ? (
        <select {...shared}>
          {options.map(([key, text]) => (
            <option key={key} value={key}>
              {text}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea {...shared} rows={props.rows || 4} />
      ) : (
        <input
          {...shared}
          type={type}
          {...(type === "checkbox"
            ? { checked: Boolean(value), value: undefined }
            : {})}
        />
      )}
      {(error || hint) && (
        <small id={`${id}-help`} className={error ? s.fieldError : s.muted}>
          {error || hint}
        </small>
      )}
    </div>
  );
}
export function ImageField(props) {
  return (
    <div className={s.imageField}>
      <Field {...props} type="url" maxLength={1000} />
      <div className={s.preview}>
        {validImageUrl(props.value) ? (
          <Image src={props.value} alt={`${props.label} preview`} />
        ) : (
          <span>Image preview</span>
        )}
      </div>
    </div>
  );
}
export function ItemActions({ index, length, move, remove, name }) {
  return (
    <div className={s.actions}>
      <button
        type="button"
        disabled={index === 0}
        onClick={() => move(-1)}
        aria-label={`Move ${name} ${index + 1} up`}
      >
        Move up
      </button>
      <button
        type="button"
        disabled={index === length - 1}
        onClick={() => move(1)}
        aria-label={`Move ${name} ${index + 1} down`}
      >
        Move down
      </button>
      <button
        type="button"
        onClick={remove}
        aria-label={`Remove ${name} ${index + 1}`}
      >
        Remove
      </button>
    </div>
  );
}
export function ListEditor({
  label,
  itemLabel,
  items,
  onChange,
  errors = {},
  path,
  images = false,
}) {
  const Component = images ? ImageField : Field;
  return (
    <fieldset className={s.editor}>
      <legend>{label}</legend>
      {errors[path] && <p className={s.fieldError}>{errors[path]}</p>}
      {items.map((item, index) => (
        <div key={index} className={s.editorItem}>
          <Component
            label={`${itemLabel} ${index + 1}`}
            value={item}
            maxLength={1000}
            error={errors[`${path}.${index}`]}
            onChange={(value) =>
              onChange(
                items.map((current, i) => (i === index ? value : current)),
              )
            }
          />
          <ItemActions
            index={index}
            length={items.length}
            name={itemLabel}
            move={(direction) => onChange(moveItem(items, index, direction))}
            remove={() => onChange(items.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      <button
        type="button"
        disabled={items.length >= 50}
        onClick={() => onChange([...items, ""])}
      >
        Add {itemLabel.toLowerCase()}
      </button>
      <small className={s.muted}>Up to 50 items.</small>
    </fieldset>
  );
}
