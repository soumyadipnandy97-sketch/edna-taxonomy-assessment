import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { LoadingSpinner, NotificationBanner } from '../components/UI';
import { apiFetch } from '../lib/api';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface DatasetOption {
  id: number;
  datasetName: string;
  sampleName: string;
}

const STARTER_PROMPTS = [
  'Interpret the Shannon diversity and Pielou evenness metrics in my dataset.',
  'Summarize the unclassified and potentially novel OTU clusters and suggest next validation steps.',
  'Compare the dominant taxa detected and explain the caveats of eDNA read abundance.',
  'What ecological differences stand out across my analyzed environmental samples?',
];

export function BioAIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [datasets, setDatasets] = useState<DatasetOption[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<{ messages: ChatMessage[] }>('/api/assistant/messages'),
      apiFetch<{ datasets: DatasetOption[] }>('/api/datasets'),
    ])
      .then(([msgRes, dsRes]) => {
        setMessages(msgRes.messages);
        setDatasets(dsRes.datasets);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Unable to initialize BioAI Assistant.')
      )
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async (textToSend?: string) => {
    const prompt = (textToSend ?? input).trim();
    if (!prompt || sending) return;
    setError('');
    setSending(true);
    setInput('');

    // Optimistic user bubble
    const tempId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: 'user', content: prompt, createdAt: new Date().toISOString() },
    ]);

    try {
      const res = await apiFetch<{
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
      }>('/api/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: prompt,
          datasetId: selectedDatasetId ? Number(selectedDatasetId) : null,
        }),
      });
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        res.userMessage,
        res.assistantMessage,
      ]);
    } catch (err: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(err instanceof Error ? err.message : 'BioAI Assistant request failed.');
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    setError('');
    try {
      await apiFetch('/api/assistant/messages', { method: 'DELETE' });
      setMessages([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to clear conversation.');
    }
  };

  return (
    <DashboardLayout
      title="BioAI Assistant"
      subtitle="Grounded scientific interpretation powered by Gemini on the backend using your actual PostgreSQL taxonomic and biodiversity analysis results."
      action={
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] text-[#071B35] dark:text-white"
          >
            <option value="">Context: Latest Analyzed Datasets (Up to 3)</option>
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                Context: {d.datasetName} ({d.sampleName})
              </option>
            ))}
          </select>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-[#1B3A63] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#133058]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      }
    >
      {error && <NotificationBanner type="error" message={error} onDismiss={() => setError('')} />}

      <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl flex flex-col h-[calc(100vh-230px)] min-h-[500px]">
        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {loadingHistory ? (
            <LoadingSpinner label="Loading scientific conversation history..." />
          ) : messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
              <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-[#133058] text-[#0A4C7A] dark:text-[#21D4FD] flex items-center justify-center mx-auto">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[#071B35] dark:text-white">
                  Ask BioAI Assistant about your eDNA results
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  BioAI Assistant inspects your selected PostgreSQL biodiversity metrics, taxonomic
                  assignments, and unclassified OTU clusters—never inventing species or readings.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-[#1B3A63] bg-slate-50 dark:bg-[#071B35] text-xs text-slate-700 dark:text-slate-200 hover:border-[#0A4C7A] dark:hover:border-[#21D4FD] transition-colors text-left leading-relaxed"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-xl px-4 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326]'
                      : 'bg-slate-50 dark:bg-[#071B35] border border-slate-200 dark:border-[#1B3A63] text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div
                    className={`text-[11px] font-mono mb-1.5 ${
                      msg.role === 'user'
                        ? 'opacity-75'
                        : 'text-[#0A4C7A] dark:text-[#21D4FD]'
                    }`}
                  >
                    {msg.role === 'user' ? 'Researcher' : 'BioAI Assistant'}
                  </div>
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-slate-50 dark:bg-[#071B35] border border-slate-200 dark:border-[#1B3A63] rounded-xl px-4 py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                <span>Analyzing your dataset context...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="p-4 border-t border-slate-200 dark:border-[#1B3A63] flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            placeholder="Ask about taxonomic distribution, Shannon/Simpson metrics, or unclassified sequences..."
            className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
