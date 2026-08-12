"use client";

import { useState, useTransition } from "react";
import { saveFaqs } from "@/actions/faqs";
import { useLoading } from "@/components/LoadingProvider";
import Button from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { IconPlus, IconTrash, IconPencil, IconChevronDown } from "@/components/icons";
import type { FaqCategory, Faq } from "@/types/faq";

const newFaq = (): Faq => ({ id: crypto.randomUUID().slice(0, 8), question: "", answer: "" });
const newCat = (): FaqCategory => ({ id: crypto.randomUUID().slice(0, 8), name: "", faqs: [] });

export default function FaqsEditor({ initialItems }: { initialItems: FaqCategory[] }) {
  const [cats, setCats] = useState(initialItems);
  const [openCat, setOpenCat] = useState<number | null>(0);
  const [editingFaq, setEditingFaq] = useState<{ catIdx: number; faqIdx: number } | null>(null);
  const [faqDraft, setFaqDraft] = useState<Faq>(newFaq());
  const [addingFaq, setAddingFaq] = useState<number | null>(null);
  const [addingCat, setAddingCat] = useState(false);
  const [catDraft, setCatDraft] = useState<FaqCategory>(newCat());
  const [isPending, startTransition] = useTransition();
  const { showLoading, hideLoading } = useLoading();

  const save = (updated: FaqCategory[]) => {
    setCats(updated);
    showLoading();
    startTransition(async () => {
      try {
        await saveFaqs(updated);
      } finally {
        hideLoading();
      }
    });
  };

  const addCategory = () => { save([...cats, catDraft]); setAddingCat(false); setCatDraft(newCat()); };
  const removeCategory = (i: number) => {
    if (!window.confirm("Delete this category and all its questions?")) return;
    save(cats.filter((_, idx) => idx !== i));
  };

  const commitAddFaq = (catIdx: number) => {
    const updated = cats.map((c, i) => i === catIdx ? { ...c, faqs: [...c.faqs, faqDraft] } : c);
    save(updated);
    setAddingFaq(null);
    setFaqDraft(newFaq());
  };

  const commitEditFaq = () => {
    if (!editingFaq) return;
    const { catIdx, faqIdx } = editingFaq;
    const updated = cats.map((c, ci) =>
      ci === catIdx ? { ...c, faqs: c.faqs.map((f, fi) => (fi === faqIdx ? faqDraft : f)) } : c
    );
    save(updated);
    setEditingFaq(null);
  };

  const removeFaq = (catIdx: number, faqIdx: number) => {
    if (!window.confirm("Delete this question?")) return;
    const updated = cats.map((c, ci) =>
      ci === catIdx ? { ...c, faqs: c.faqs.filter((_, fi) => fi !== faqIdx) } : c
    );
    save(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => { setAddingCat(true); setCatDraft(newCat()); }} disabled={addingCat}>
          <IconPlus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {addingCat && (
        <div className="bg-surface-hover border border-border rounded-xl p-4 space-y-3">
          <Field label="Category Name">
            <Input
              type="text"
              value={catDraft.name}
              onChange={(e) => setCatDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" onClick={addCategory} disabled={isPending}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setAddingCat(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {cats.map((cat, ci) => (
        <div key={cat.id} className="bg-surface border border-border rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-hover transition-colors"
            onClick={() => setOpenCat(openCat === ci ? null : ci)}
          >
            <span className="font-medium text-sm text-text">{cat.name || "(Unnamed)"}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-subtle">{cat.faqs.length} questions</span>
              <IconChevronDown className={`w-4 h-4 text-text-subtle transition-transform ${openCat === ci ? "rotate-180" : ""}`} />
            </div>
          </button>

          {openCat === ci && (
            <div className="border-t border-border px-5 py-4 space-y-3">
              {cat.faqs.map((faq, fi) => (
                <div key={faq.id} className="border border-border rounded-lg p-3">
                  {editingFaq?.catIdx === ci && editingFaq.faqIdx === fi ? (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        value={faqDraft.question}
                        onChange={(e) => setFaqDraft((d) => ({ ...d, question: e.target.value }))}
                        placeholder="Question"
                      />
                      <Textarea
                        rows={3}
                        value={faqDraft.answer}
                        onChange={(e) => setFaqDraft((d) => ({ ...d, answer: e.target.value }))}
                        placeholder="Answer"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={commitEditFaq} disabled={isPending}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingFaq(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text">{faq.question}</div>
                        <div className="text-xs text-text-muted mt-1">{faq.answer}</div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditingFaq({ catIdx: ci, faqIdx: fi }); setFaqDraft({ ...faq }); }}
                        >
                          <IconPencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => removeFaq(ci, fi)}>
                          <IconTrash className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {addingFaq === ci ? (
                <div className="border border-border rounded-lg p-3 bg-surface-hover space-y-2">
                  <Input
                    type="text"
                    value={faqDraft.question}
                    onChange={(e) => setFaqDraft((d) => ({ ...d, question: e.target.value }))}
                    placeholder="Question"
                  />
                  <Textarea
                    rows={3}
                    value={faqDraft.answer}
                    onChange={(e) => setFaqDraft((d) => ({ ...d, answer: e.target.value }))}
                    placeholder="Answer"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => commitAddFaq(ci)} disabled={isPending}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddingFaq(null); setFaqDraft(newFaq()); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => { setAddingFaq(ci); setFaqDraft(newFaq()); }}>
                  <IconPlus className="w-3.5 h-3.5" /> Add Question
                </Button>
              )}

              <div className="pt-1 flex justify-end">
                <Button size="sm" variant="danger" onClick={() => removeCategory(ci)}>
                  <IconTrash className="w-3.5 h-3.5" /> Delete Category
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
