import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDestinations } from "../../api/api";
import { categories } from "../../config/site";
import { useResource } from "../../hooks/useResource";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useFeedback } from "../context/FeedbackContext";
import {
  contentPayload,
  initialContent,
  labels,
  moveItem,
  slugify,
  validateContent,
} from "../content";
import {
  Field,
  ImageField,
  ItemActions,
  ListEditor,
} from "../components/Fields";
import { ResourceState } from "../components/Listing";
import UnsavedChanges from "../components/UnsavedChanges";
import s from "../styles/Admin.module.css";
function Editor({ kind, record }) {
  const { request } = useAdminAuth();
  const notify = useFeedback();
  const navigate = useNavigate();
  const [values, setValues] = useState(() => initialContent(kind, record));
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify(initialContent(kind, record)),
  );
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const manualSlug = useRef(Boolean(record));
  const pending = useRef(false);
  const dirty = JSON.stringify(values) !== baseline;
  const destinations = useResource(
    useCallback(
      kind === "packages" ? (signal) => getDestinations(signal) : null,
      [kind],
    ),
  );
  const set = (key, value) => {
    setSaved(false);
    setValues((current) => ({ ...current, [key]: value }));
  };
  const nested = (key, child, value) =>
    set(key, { ...values[key], [child]: value });
  const field = (key, label, options = {}) => (
    <Field
      label={label}
      value={values[key]}
      onChange={(value) => set(key, value)}
      error={errors[key]}
      {...options}
    />
  );
  const nestedField = (key, child, label, options = {}) => (
    <Field
      label={label}
      value={values[key][child]}
      onChange={(value) => nested(key, child, value)}
      error={errors[`${key}.${child}`]}
      {...options}
    />
  );
  const list = (key, label, itemLabel, images = false) => (
    <ListEditor
      label={label}
      itemLabel={itemLabel}
      path={key}
      items={values[key]}
      onChange={(value) => set(key, value)}
      errors={errors}
      images={images}
    />
  );
  const nestedList = (key, child, label, itemLabel) => (
    <ListEditor
      label={label}
      itemLabel={itemLabel}
      path={`${key}.${child}`}
      items={values[key][child]}
      onChange={(value) => nested(key, child, value)}
      errors={errors}
    />
  );
  const submit = async (event) => {
    event.preventDefault();
    if (pending.current) return;
    const validation = validateContent(kind, values);
    setErrors(validation);
    setError("");
    if (Object.keys(validation).length) {
      setError("Please check the highlighted fields.");
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      await request(`${kind}${record ? `/${record.id}` : ""}`, {
        method: record ? "PATCH" : "POST",
        body: contentPayload(kind, values),
      });
      setBaseline(JSON.stringify(values));
      setSaved(true);
      notify(`${labels[kind]} saved.`);
      // Update in place; create returns to list after the dirty blocker has cleared.
      if (!record) setCreated(true);
    } catch (err) {
      setError(err.message);
      setErrors(
        err.status === 409 && err.message === "This slug is already in use."
          ? { slug: err.message }
          : err.fields || {},
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const [created, setCreated] = useState(false);
  useEffect(() => {
    if (created && !dirty) navigate(`/admin/${kind}`);
  }, [created, dirty, navigate, kind]);
  const titleKey = kind === "packages" ? "title" : "name";
  const modifyName = (value) => {
    setSaved(false);
    setValues((current) => ({
      ...current,
      [titleKey]: value,
      ...(!manualSlug.current
        ? {
            slug: slugify(value)
              .slice(0, kind === "packages" ? 160 : 120)
              .replace(/-$/, ""),
          }
        : {}),
    }));
  };
  const arrayObject = (key, index, child, value) =>
    set(
      key,
      values[key].map((item, i) =>
        i === index ? { ...item, [child]: value } : item,
      ),
    );
  return (
    <>
      <UnsavedChanges dirty={dirty} />
      <form
        onSubmit={submit}
        className={s.form}
        noValidate
        aria-label={`${labels[kind]} form`}
      >
        <fieldset className={s.fieldset} disabled={busy}>
          <section className={s.panel}>
            <h2>Basics</h2>
            <div className={s.form}>
              <Field
                label={kind === "packages" ? "Title" : "Name"}
                required
                maxLength={kind === "packages" ? 220 : 160}
                value={values[titleKey]}
                onChange={modifyName}
                error={errors[titleKey]}
              />
              <Field
                label="Slug"
                required
                maxLength={kind === "packages" ? 160 : 120}
                value={values.slug}
                onChange={(value) => {
                  manualSlug.current = true;
                  set("slug", value);
                }}
                error={errors.slug}
                hint="Used in the public URL. Lowercase letters, numbers and hyphens."
              />
              {kind === "destinations" &&
                field("region", "Region", { required: true, maxLength: 160 })}
              {kind !== "experiences" &&
                field("short_desc", "Short description", {
                  type: "textarea",
                  required: true,
                  maxLength: 500,
                  rows: 3,
                })}
              {kind !== "packages" &&
                field("description", "Description", {
                  type: "textarea",
                  required: true,
                  maxLength: 20000,
                  rows: 7,
                })}
              <ImageField
                label="Main image URL"
                value={values.image}
                onChange={(value) => set("image", value)}
                error={errors.image}
                required
                hint="Use an HTTP(S) image URL you have permission to publish. Uploads are not supported."
              />
            </div>
          </section>
          {kind === "destinations" && (
            <>
              <section className={s.panel}>
                <h2>Destination content</h2>
                <div className={s.form}>
                  {list("why_visit", "Why visit", "Reason")}
                  <fieldset className={s.editor}>
                    <legend>Top places</legend>
                    {errors.top_places && (
                      <p className={s.fieldError}>{errors.top_places}</p>
                    )}
                    {values.top_places.map((place, index) => (
                      <div className={s.editorItem} key={index}>
                        <h3>Place {index + 1}</h3>
                        <Field
                          label={`Place ${index + 1} name`}
                          maxLength={160}
                          value={place.name}
                          onChange={(value) =>
                            arrayObject("top_places", index, "name", value)
                          }
                          error={errors[`top_places.${index}.name`]}
                        />
                        <Field
                          type="textarea"
                          label={`Place ${index + 1} description`}
                          maxLength={2000}
                          value={place.description}
                          onChange={(value) =>
                            arrayObject(
                              "top_places",
                              index,
                              "description",
                              value,
                            )
                          }
                          error={errors[`top_places.${index}.description`]}
                        />
                        <ImageField
                          label={`Place ${index + 1} image URL (optional)`}
                          value={place.image || ""}
                          onChange={(value) =>
                            arrayObject("top_places", index, "image", value)
                          }
                          error={errors[`top_places.${index}.image`]}
                        />
                        <ItemActions
                          name="place"
                          index={index}
                          length={values.top_places.length}
                          move={(direction) =>
                            set(
                              "top_places",
                              moveItem(values.top_places, index, direction),
                            )
                          }
                          remove={() =>
                            set(
                              "top_places",
                              values.top_places.filter((_, i) => i !== index),
                            )
                          }
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={values.top_places.length >= 50}
                      onClick={() =>
                        set("top_places", [
                          ...values.top_places,
                          { name: "", description: "" },
                        ])
                      }
                    >
                      Add place
                    </button>
                  </fieldset>
                  {nestedField(
                    "travel_info",
                    "best_time",
                    "Best time to visit",
                    { type: "textarea", required: true, maxLength: 1000 },
                  )}
                  {nestedField("travel_info", "how_to_reach", "How to reach", {
                    type: "textarea",
                    required: true,
                    maxLength: 2000,
                  })}
                  {nestedList(
                    "travel_info",
                    "tips",
                    "Travel tips",
                    "Travel tip",
                  )}
                </div>
              </section>
            </>
          )}
          {kind === "packages" && (
            <>
              <section className={s.panel}>
                <h2>Trip & pricing</h2>
                <ResourceState resource={destinations} />
                <div className={s.form}>
                  <div className={s.grid}>
                    {field("destination_id", "Destination", {
                      required: true,
                      options: [
                        ["", "Choose destination"],
                        ...(destinations.data || []).map((item) => [
                          String(item.id),
                          item.name,
                        ]),
                      ],
                    })}
                    {field("category", "Category", { options: categories })}
                  </div>
                  {field("route", "Route", { required: true, maxLength: 500 })}
                  <div className={s.grid}>
                    {field("duration_days", "Duration (days)", {
                      type: "number",
                      required: true,
                      min: 1,
                      max: 365,
                      step: 1,
                    })}
                    {field("price", "Price (₹ INR)", {
                      type: "number",
                      required: true,
                      min: 0,
                      max: 4294967295,
                      step: 1,
                    })}
                  </div>
                  {field("rating", "Rating (optional)", {
                    type: "number",
                    min: 0,
                    max: 5,
                    step: "any",
                    hint: "Leave blank if no rating is available.",
                  })}
                </div>
              </section>
              <section className={s.panel}>
                <h2>Images & highlights</h2>
                <div className={s.form}>
                  {list("gallery", "Gallery", "Image", true)}
                  {list("highlights", "Highlights", "Highlight")}
                </div>
              </section>
              <section className={s.panel}>
                <h2>Itinerary</h2>
                <p className={s.muted}>
                  Reordering days also renumbers them sequentially. Up to 365
                  days.
                </p>
                {errors.itinerary && (
                  <p className={s.fieldError}>{errors.itinerary}</p>
                )}
                <div className={s.form}>
                  {values.itinerary.map((day, index) => (
                    <div className={s.editorItem} key={index}>
                      <h3>Itinerary day {index + 1}</h3>
                      <div className={s.grid}>
                        <Field
                          label={`Day ${index + 1} number`}
                          type="number"
                          min={1}
                          max={365}
                          step={1}
                          value={day.day}
                          onChange={(value) =>
                            arrayObject("itinerary", index, "day", value)
                          }
                          error={errors[`itinerary.${index}.day`]}
                        />
                        <Field
                          label={`Day ${index + 1} title`}
                          maxLength={220}
                          value={day.title}
                          onChange={(value) =>
                            arrayObject("itinerary", index, "title", value)
                          }
                          error={errors[`itinerary.${index}.title`]}
                        />
                      </div>
                      <Field
                        label={`Day ${index + 1} description`}
                        type="textarea"
                        maxLength={10000}
                        value={day.description}
                        onChange={(value) =>
                          arrayObject("itinerary", index, "description", value)
                        }
                        error={errors[`itinerary.${index}.description`]}
                      />
                      <ListEditor
                        label={`Day ${index + 1} activities`}
                        itemLabel="Activity"
                        items={day.activities}
                        path={`itinerary.${index}.activities`}
                        errors={errors}
                        onChange={(value) =>
                          arrayObject("itinerary", index, "activities", value)
                        }
                      />
                      <ItemActions
                        name="day"
                        index={index}
                        length={values.itinerary.length}
                        move={(direction) =>
                          set(
                            "itinerary",
                            moveItem(values.itinerary, index, direction).map(
                              (item, i) => ({ ...item, day: i + 1 }),
                            ),
                          )
                        }
                        remove={() =>
                          set(
                            "itinerary",
                            values.itinerary.filter((_, i) => i !== index),
                          )
                        }
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={values.itinerary.length >= 365}
                    onClick={() =>
                      set("itinerary", [
                        ...values.itinerary,
                        {
                          day: Math.min(
                            365,
                            Math.max(
                              0,
                              ...values.itinerary.map(
                                (item) => Number(item.day) || 0,
                              ),
                            ) + 1,
                          ),
                          title: "",
                          description: "",
                          activities: [],
                        },
                      ])
                    }
                  >
                    Add day
                  </button>
                </div>
              </section>
              <section className={s.panel}>
                <h2>Included & useful information</h2>
                <div className={s.form}>
                  {list("inclusions", "Inclusions", "Inclusion")}
                  {list("exclusions", "Exclusions", "Exclusion")}
                  {nestedList(
                    "info",
                    "important",
                    "Important information",
                    "Important item",
                  )}
                  {nestedList("info", "tips", "Travel tips", "Travel tip")}
                </div>
              </section>
            </>
          )}
          {kind === "experiences" && (
            <section className={s.panel}>
              <h2>Experience examples</h2>
              {list("examples", "Examples", "Example")}
            </section>
          )}
          <section className={s.panel}>
            <h2>Visibility & order</h2>
            <div className={s.form}>
              {kind === "packages" ? (
                <>
                  {field("status", "Status", {
                    options: [
                      ["draft", "Draft"],
                      ["published", "Published"],
                    ],
                    hint: "Draft packages are hidden from public pages and APIs. Published packages are visible publicly.",
                  })}
                  {field("best_seller", "Best seller", { type: "checkbox" })}
                </>
              ) : (
                field("sort", "Sort order", {
                  type: "number",
                  min: -100000,
                  max: 100000,
                  step: 1,
                  hint: "Lower numbers appear first.",
                })
              )}
              {kind !== "experiences" &&
                field("featured", "Featured", { type: "checkbox" })}
            </div>
          </section>
        </fieldset>
        {error && (
          <div role="alert" className={s.error}>
            <p>{error}</p>
            {Object.entries(errors).length > 0 && (
              <ul>
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>
                    {key.replaceAll("_", " ")}: {message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className={s.savebar}>
          <button className={s.primary} disabled={busy} type="submit">
            {busy
              ? "Saving…"
              : record
                ? "Save changes"
                : `Create ${labels[kind].toLowerCase()}`}
          </button>
          <Link className={s.button} to={`/admin/${kind}`}>
            Cancel
          </Link>
          <span role="status" className={s.muted}>
            {saved
              ? "Saved."
              : dirty
                ? "Unsaved changes"
                : record
                  ? "All changes saved"
                  : "Ready to create"}
          </span>
        </div>
      </form>
    </>
  );
}
export default function ContentForm({ kind }) {
  const { id } = useParams();
  const { request } = useAdminAuth();
  const validId = id === undefined || /^[1-9]\d*$/.test(id);
  const resource = useResource(
    useCallback(
      id && validId ? (signal) => request(`${kind}/${id}`, { signal }) : null,
      [id, kind, request, validId],
    ),
  );
  return (
    <>
      <div className={s.heading}>
        <div>
          <h1>
            {id ? "Edit" : "Add"} {labels[kind].toLowerCase()}
          </h1>
          <p className={s.muted}>Changes are saved to your website database.</p>
        </div>
        <Link to={`/admin/${kind}`}>Back to {kind}</Link>
      </div>
      {!validId ? (
        <p role="alert" className={s.error}>
          Invalid content ID.
        </p>
      ) : (
        <>
          <ResourceState resource={resource} />
          {(!id || resource.data) && (
            <Editor
              key={`${kind}-${id || "new"}`}
              kind={kind}
              record={resource.data}
            />
          )}
        </>
      )}
    </>
  );
}
