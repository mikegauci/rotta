"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createCategory,
  deletePost,
  savePost,
  type PostInput,
} from "@/app/(admin)/admin/posts/actions";
import { MediaField, type PickedMedia } from "@/components/admin/media-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { slugify } from "@/lib/slug";

export type EditorPost = Omit<PostInput, "featuredMediaId" | "heroMediaId"> & {
  featured: PickedMedia | null;
  hero: PickedMedia | null;
};

type Option = { id: string; name: string };

const field =
  "w-full rounded border border-[#ddd] bg-white px-3 py-2 text-sm focus:border-[#999] focus:outline-none";
const panel = "space-y-4 rounded-lg bg-white p-5 shadow-sm";

// datetime-local works in local time; the DB stores UTC.
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function PostEditor({
  initial,
  categories: initialCategories,
  authors,
  tagSuggestions,
}: {
  initial: EditorPost;
  categories: Option[];
  authors: Option[];
  tagSuggestions: string[];
}) {
  const router = useRouter();
  const [post, setPost] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [categories, setCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();

  function update(patch: Partial<EditorPost>) {
    setPost((p) => ({ ...p, ...patch }));
    setDirty(true);
    setMessage(null);
  }

  function save(status = post.status) {
    start(async () => {
      const result = await savePost({
        ...post,
        status,
        featuredMediaId: post.featured?.id ?? null,
        heroMediaId: post.hero?.id ?? null,
      });
      if ("error" in result) {
        setMessage({ ok: false, text: result.error });
        return;
      }
      setPost((p) => ({ ...p, id: result.id, slug: result.slug, status }));
      setDirty(false);
      setSlugTouched(true);
      setMessage({
        ok: true,
        text: status === "published" ? "Saved and published." : "Draft saved.",
      });
      if (!post.id) router.replace(`/admin/posts/${result.id}/`);
      else router.refresh();
    });
  }

  function remove() {
    if (
      !post.id ||
      !window.confirm(`Delete “${post.title}”? This can’t be undone.`)
    )
      return;
    start(async () => {
      const result = await deletePost(post.id!);
      if (result.error) return setMessage({ ok: false, text: result.error });
      router.push("/admin/posts/");
    });
  }

  function addTag(name: string) {
    const clean = name.trim();
    if (clean && !post.tags.some((t) => slugify(t) === slugify(clean)))
      update({ tags: [...post.tags, clean] });
    setTagInput("");
  }

  async function addCategory() {
    const result = await createCategory(newCategory);
    if ("error" in result && result.error)
      return setMessage({ ok: false, text: result.error });
    if ("category" in result && result.category) {
      const c = result.category;
      setCategories((list) => [...list, { id: c.id, name: c.name }]);
      update({ categoryIds: [...post.categoryIds, c.id] });
      setNewCategory("");
    }
  }

  const published = post.status === "published";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">
        <div className={panel}>
          <input
            value={post.title}
            onChange={(e) =>
              update({
                title: e.target.value,
                ...(slugTouched ? {} : { slug: slugify(e.target.value) }),
              })
            }
            placeholder="Post title"
            aria-label="Title"
            className="text-ink w-full text-2xl font-black outline-none placeholder:text-[#bbb]"
          />
          <label className="text-muted flex items-center gap-1 text-sm">
            rotta.mt/
            <input
              value={post.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update({ slug: e.target.value });
              }}
              onBlur={() => update({ slug: slugify(post.slug) })}
              aria-label="URL slug"
              className="min-w-0 flex-1 rounded border border-transparent px-1 py-0.5 hover:border-[#ddd] focus:border-[#999] focus:outline-none"
            />
            /
          </label>
          <input
            value={post.subtitle}
            onChange={(e) => update({ subtitle: e.target.value })}
            placeholder="Subtitle under the title in the header (optional)"
            aria-label="Subtitle"
            className={field}
          />
        </div>

        <RichTextEditor
          value={post.content}
          onChange={(content) => update({ content })}
        />

        <div className={panel}>
          <label className="block">
            <span className="text-ink mb-1 block text-sm font-semibold">
              Excerpt
            </span>
            <textarea
              value={post.excerpt}
              onChange={(e) => update({ excerpt: e.target.value })}
              rows={3}
              className={field}
            />
            <span className="text-muted text-xs">
              Shown on the blog cards. Also the search description if the SEO
              one is empty.
            </span>
          </label>
        </div>

        <div className={panel}>
          <h2 className="text-ink font-black">SEO</h2>
          <label className="block">
            <span className="mb-1 flex justify-between text-sm font-semibold">
              Title
              <span className="text-muted font-normal">
                {(post.seo.title ?? "").length}/60
              </span>
            </span>
            <input
              value={post.seo.title ?? ""}
              onChange={(e) =>
                update({ seo: { ...post.seo, title: e.target.value } })
              }
              placeholder={post.title}
              className={field}
            />
          </label>
          <label className="block">
            <span className="mb-1 flex justify-between text-sm font-semibold">
              Description
              <span className="text-muted font-normal">
                {(post.seo.description ?? "").length}/160
              </span>
            </span>
            <textarea
              value={post.seo.description ?? ""}
              onChange={(e) =>
                update({ seo: { ...post.seo, description: e.target.value } })
              }
              placeholder={post.excerpt}
              rows={2}
              className={field}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(post.seo.noindex)}
              onChange={(e) =>
                update({ seo: { ...post.seo, noindex: e.target.checked } })
              }
            />
            Hide from search engines (noindex)
          </label>
        </div>
      </div>

      <aside className="space-y-6">
        <div className={`${panel} lg:sticky lg:top-6`}>
          <div className="flex items-center justify-between text-sm">
            <span>
              Status:{" "}
              <strong className={published ? "text-green-700" : ""}>
                {published ? "Published" : "Draft"}
              </strong>
            </span>
            {post.id && published && !dirty && (
              <Link
                href={`/${post.slug}/`}
                target="_blank"
                className="font-semibold hover:underline"
              >
                View post
              </Link>
            )}
          </div>
          <label className="block">
            <span className="text-ink mb-1 block text-sm font-semibold">
              Publish date
            </span>
            <input
              type="datetime-local"
              value={toLocalInput(post.publishedAt)}
              onChange={(e) =>
                update({
                  publishedAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
              className={field}
            />
            <span className="text-muted text-xs">
              Empty means now, when you publish.
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {published ? (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => save("published")}
                  className="bg-brand hover:text-brand flex-1 rounded-[5px] px-4 py-2 text-sm font-bold text-black hover:bg-black disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Update"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => save("draft")}
                  className="rounded-[5px] border border-[#ddd] px-3 py-2 text-sm hover:bg-[#f5f5f5] disabled:opacity-60"
                >
                  Unpublish
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => save("draft")}
                  className="rounded-[5px] border border-[#ddd] px-3 py-2 text-sm hover:bg-[#f5f5f5] disabled:opacity-60"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => save("published")}
                  className="bg-brand hover:text-brand flex-1 rounded-[5px] px-4 py-2 text-sm font-bold text-black hover:bg-black disabled:opacity-60"
                >
                  Publish
                </button>
              </>
            )}
          </div>
          {post.id && (
            <Link
              href={`/preview/${post.id}/`}
              target="_blank"
              className="block text-sm font-semibold hover:underline"
            >
              Preview{dirty ? " (save first to see changes)" : ""}
            </Link>
          )}
          {message && (
            <p
              role="status"
              className={`text-sm ${message.ok ? "text-green-700" : "text-coral"}`}
            >
              {message.text}
            </p>
          )}
          {post.id && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="text-coral text-sm hover:underline"
            >
              Delete post
            </button>
          )}
        </div>

        <div className={panel}>
          <label className="block">
            <span className="text-ink mb-1 block text-sm font-semibold">
              Author
            </span>
            <select
              value={post.authorId ?? ""}
              onChange={(e) => update({ authorId: e.target.value || null })}
              className={field}
            >
              <option value="">No author</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={panel}>
          <p className="text-ink text-sm font-semibold">Categories</p>
          <div className="space-y-1.5">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={post.categoryIds.includes(c.id)}
                  onChange={(e) =>
                    update({
                      categoryIds: e.target.checked
                        ? [...post.categoryIds, c.id]
                        : post.categoryIds.filter((id) => id !== c.id),
                    })
                  }
                />
                {c.name}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder="New category"
              className={field}
            />
            <button
              type="button"
              onClick={addCategory}
              disabled={!newCategory.trim()}
              className="rounded border border-[#ddd] px-3 text-sm disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>

        <div className={panel}>
          <p className="text-ink text-sm font-semibold">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded bg-[#eee] px-2 py-0.5 text-xs"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() =>
                    update({ tags: post.tags.filter((t) => t !== tag) })
                  }
                  className="text-muted hover:text-black"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            list="tag-suggestions"
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder="Add a tag and press Enter"
            className={field}
          />
          <datalist id="tag-suggestions">
            {tagSuggestions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div className={panel}>
          <MediaField
            label="Featured image"
            hint="Used on blog cards and when shared on social media."
            value={post.featured}
            onChange={(featured) => update({ featured })}
          />
          <MediaField
            label="Header image"
            hint="The background behind the title at the top of the post."
            value={post.hero}
            onChange={(hero) => update({ hero })}
          />
        </div>
      </aside>
    </div>
  );
}
