"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Mail } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import { formatDate } from "@/lib/utils";

export default function AdminQuestionsPage() {
  const [data, setData] = useState({ questions: [], subscribers: [] });
  const [tab, setTab] = useState("questions");
  const [answering, setAnswering] = useState(null);
  const [answer, setAnswer] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/questions");
    setData(await res.json());
  };
  useEffect(() => { load(); }, []);

  const submitAnswer = async () => {
    await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: answering.id, answer, status: "answered" }),
    });
    setAnswering(null); setAnswer("");
    await load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Customer questions & subscribers</h2>

      <div className="flex gap-2">
        {[["questions", `Questions (${data.questions.filter((q) => !q.answer).length} unanswered)`], ["subscribers", `Subscribers (${data.subscribers.length})`]].map(([k, lbl]) => (
          <button key={k} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === k ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => setTab(k)}>{lbl}</button>
        ))}
      </div>

      {tab === "questions" && (
        <DataTable
          columns={[
            { key: "question", label: "Question", render: (q) => <div><p className="font-semibold">{q.question}</p><p className="text-xs text-slate-400">q#{q.id.slice(0, 6)}</p></div> },
            { key: "status", label: "Status", render: (q) => q.answer ? <span className="badge badge-success">answered</span> : <span className="badge badge-warning">pending</span> },
            { key: "answer", label: "Answer", render: (q) => q.answer ? <span className="line-clamp-2 max-w-md text-slate-500">{q.answer}</span> : "—" },
            { key: "createdAt", label: "Asked", render: (q) => formatDate(q.createdAt, "short") },
          ]}
          rows={data.questions}
          emptyMessage="No questions yet"
          actions={(q) => !q.answer && (
            <button className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => { setAnswering(q); setAnswer(""); }}>
              <ClipboardList className="mr-1 inline h-3.5 w-3.5" /> Answer
            </button>
          )}
        />
      )}

      {tab === "subscribers" && (
        <DataTable
          columns={[
            { key: "email", label: "Email", render: (s) => <span className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4 text-slate-400" /> {s.email}</span> },
            { key: "name", label: "Name", render: (s) => s.name || "—" },
            { key: "source", label: "Source", render: (s) => <span className="badge badge-neutral">{s.source || "—"}</span> },
            { key: "status", label: "Status", render: (s) => <span className={`badge ${s.status === "active" ? "badge-success" : "badge-neutral"}`}>{s.status}</span> },
            { key: "createdAt", label: "Subscribed", render: (s) => formatDate(s.createdAt, "short") },
          ]}
          rows={data.subscribers}
          emptyMessage="No subscribers yet"
        />
      )}

      {answering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAnswering(null)}>
          <div className="card relative w-full max-w-md space-y-3 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Answer question</h3>
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{answering.question}</p>
            <div><label className="label">Answer</label><textarea className="input" rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} /></div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setAnswering(null)}>Cancel</button>
              <button className="btn-primary" onClick={submitAnswer} disabled={!answer}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}