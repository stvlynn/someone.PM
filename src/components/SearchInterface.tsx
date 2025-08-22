import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Send, Code, Twitter, Telegram, Github, Instagram, NavArrowRight } from 'iconoir-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';

export default function SearchInterface() {
  const [query, setQuery] = useState('');
  const [socials, setSocials] = useState<SocialItem[]>([]);
  const [suggestions, setSuggestions] = useState<SocialItem[]>([]);
  const [loadingLLM, setLoadingLLM] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SocialItem | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (selectedItem) {
      window.open(selectedItem.url, '_blank');
    } else {
      console.log('Search query:', query);
    }
  };

  const handleClick = () => handleSubmit();

  // --- Types & helpers ---
  type SocialItem = {
    id: string;
    name: string;
    username: string;
    icon: string; // id from YAML
    url: string;
  };

  const IconById: Record<string, (props: { className?: string }) => ReactElement> = {
    twitter: (p) => <Twitter className={p.className} />,
    telegram: (p) => <Telegram className={p.className} />,
    github: (p) => <Github className={p.className} />,
    instagram: (p) => <Instagram className={p.className} />,
  };

  // very small YAML parser for our flat list structure (public/socials.yaml)
  function parseSocialYaml(text: string): SocialItem[] {
    const lines = text.split(/\r?\n/);
    const items: SocialItem[] = [];
    let current: Partial<SocialItem> | null = null;
    for (let raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      if (line.startsWith('items:')) continue;
      if (line.startsWith('- ')) {
        if (current) {
          // push previous
          if (current.id && current.name && current.username && current.icon && current.url) {
            items.push(current as SocialItem);
          }
        }
        current = {};
        const afterDash = line.slice(2).trim();
        if (afterDash.includes(':')) {
          const [k, v] = afterDash.split(/:\s*/, 2);
          (current as any)[k] = v;
        }
        continue;
      }
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (m && current) {
        const key = m[1];
        let val = m[2];
        // strip quotes if any
        val = val.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        (current as any)[key] = val;
      }
    }
    if (current) {
      if (current.id && current.name && current.username && current.icon && current.url) {
        items.push(current as SocialItem);
      }
    }
    return items;
  }

  async function loadSocials() {
    try {
      const res = await fetch('/socials.yaml');
      const txt = await res.text();
      const items = parseSocialYaml(txt);
      setSocials(items);
      setSuggestions(items); // default
    } catch (e) {
      console.error('Failed to load socials.yaml', e);
    }
  }

  useEffect(() => {
    loadSocials();
  }, []);

  // local lightweight similarity as fallback
  function localRank(q: string, items: SocialItem[]): SocialItem[] {
    const s = q.toLowerCase();
    const scored = items.map((it) => {
      const hay = `${it.name} ${it.id} ${it.username}`.toLowerCase();
      let score = 0;
      if (hay.startsWith(s)) score += 3;
      if (hay.includes(s)) score += 1;
      if (it.name.toLowerCase().startsWith(s)) score += 2;
      return { it, score };
    });
    return scored.sort((a, b) => b.score - a.score).map((x) => x.it);
  }

  async function llmRank(q: string, items: SocialItem[]): Promise<SocialItem[] | null> {
    const key = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    if (!key) return null;

    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoadingLLM(true);

      const system = `You are a ranking function. Given a user query string and a list of social entries, return a JSON array named \"results\" with objects {id, reason} sorted by best match. Only include ids from the input list.`;
      const user = {
        query: q,
        items: items.map((x) => ({ id: x.id, name: x.name, username: x.username }))
      };

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: `Query: ${q}\nItems: ${JSON.stringify(user.items)}\nReturn only JSON like {\"results\":[{\"id\":string,\"reason\":string}]}` },
          ],
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(text) as { results?: { id: string }[] };
      const order = parsed.results?.map((r) => r.id) ?? [];
      if (!order.length) return null;
      const map = new Map(items.map((x) => [x.id, x] as const));
      const ranked: SocialItem[] = [];
      for (const id of order) {
        const hit = map.get(id);
        if (hit) ranked.push(hit);
      }
      // append any missing items
      for (const it of items) if (!order.includes(it.id)) ranked.push(it);
      return ranked;
    } catch (err) {
      console.warn('LLM rank failed, fallback to local', err);
      return null;
    } finally {
      setLoadingLLM(false);
    }
  }

  // Handle item selection
  const handleSelectItem = (item: SocialItem) => {
    setSelectedItem(item);
    setQuery(`${item.name} (${item.username})`);
    setSuggestions([]); // Clear suggestions dropdown
    setHighlightedIndex(-1);
  };

  // recompute suggestions on query change
  useEffect(() => {
    const run = async () => {
      if (!query.trim()) {
        setSuggestions(socials);
        setSelectedItem(null); // Clear selection when query is cleared
        setHighlightedIndex(-1);
        return;
      }
      const local = localRank(query, socials);
      const llm = await llmRank(query, socials);
      setSuggestions(llm && llm.length ? llm : local);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, socials]);

  // Handle click outside to blur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    if (isFocused) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFocused]);

  return (
    <div className="relative w-screen h-screen z-10 flex items-center justify-center pointer-events-none">
      {/* Background blur overlay when focused */}
      <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-none transition-opacity duration-300 ${
        isFocused ? 'opacity-100' : 'opacity-0'
      }`} />
      
      <div ref={containerRef} className="flex items-center gap-14 pointer-events-auto relative z-20">
        {/* Left: Glass Input */}
        <form onSubmit={handleSubmit} aria-label="Search" className="relative">
          <div className="relative flex items-center w-[520px] h-16 px-6 bg-black/30 backdrop-blur-xl ring-1 ring-white/25 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
            <GlowingEffect
              variant="white"
              glow={true}
              disabled={false}
              proximity={64}
              spread={40}
              inactiveZone={0.01}
            />
            <div className="w-10 flex items-center justify-center shrink-0">
              {selectedItem ? (
                (() => {
                  const Icon = IconById[selectedItem.icon] ?? ((p: any) => <Code {...p} />);
                  return <Icon className="w-5 h-5 text-white/80" />;
                })()
              ) : (
                <Code className="w-5 h-5 text-white/80" aria-hidden />
              )}
            </div>
            <input
              type="text"
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedItem(null); // Clear selection when user types
              }}
              onFocus={() => setIsFocused(true)}
              onKeyDown={(e) => {
                const visible = suggestions.slice(0, 5);
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setIsFocused(true);
                  setHighlightedIndex((prev) => {
                    const next = prev < visible.length - 1 ? prev + 1 : 0;
                    return visible.length ? next : -1;
                  });
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setIsFocused(true);
                  setHighlightedIndex((prev) => {
                    const next = prev > 0 ? prev - 1 : visible.length - 1;
                    return visible.length ? next : -1;
                  });
                } else if (e.key === 'Enter') {
                  const visible = suggestions.slice(0, 5);
                  if (highlightedIndex >= 0 && highlightedIndex < visible.length) {
                    e.preventDefault();
                    handleSelectItem(visible[highlightedIndex]);
                    handleSubmit();
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsFocused(false);
                  setHighlightedIndex(-1);
                  inputRef.current?.blur();
                }
              }}
              placeholder="Type Anything..."
              role="combobox"
              aria-expanded={Boolean(query && suggestions.length > 0)}
              aria-controls="search-suggestions"
              aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
              aria-autocomplete="list"
              className="ml-3 flex-1 bg-transparent text-white placeholder-white/70 outline-none"
            />
          </div>
          {/* Suggestions dropdown */}
          {query && suggestions.length > 0 && (
            <div
              id="search-suggestions"
              role="listbox"
              aria-label="Search suggestions"
              className="relative absolute left-0 top-full mt-16 w-[520px] bg-black/30 backdrop-blur-xl ring-1 ring-white/25 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden"
            >
              <GlowingEffect
                variant="white"
                glow={true}
                disabled={false}
                proximity={64}
                spread={40}
                inactiveZone={0.01}
              />
              {suggestions.slice(0, 5).map((s, index) => {
                const Icon = IconById[s.icon] ?? ((p: any) => <Code {...p} />);
                return (
                  <div key={s.id}>
                    <div
                      id={`option-${index}`}
                      role="option"
                      aria-selected={highlightedIndex === index}
                      tabIndex={-1}
                      className={`flex items-center h-14 px-6 cursor-pointer transition-colors ${
                        highlightedIndex === index ? 'bg-white/15' : 'hover:bg-white/10'
                      }`}
                      onClick={() => handleSelectItem(s)}
                      onMouseMove={() => setHighlightedIndex(index)}
                    >
                      <div className="w-10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-white/80" />
                      </div>
                      <div className="ml-3 flex-1 flex items-center gap-3 min-w-0">
                        <span className="text-white whitespace-nowrap">{s.name}</span>
                        <span className="text-white/60 whitespace-nowrap">{s.username}</span>
                      </div>
                      <div className="w-10 flex items-center justify-center shrink-0 opacity-80">
                        <NavArrowRight className="w-5 h-5 text-white/80" />
                      </div>
                    </div>
                    {index < suggestions.slice(0, 5).length - 1 && (
                      <div className="h-px bg-white/10 mx-5" />
                    )}
                  </div>
                );
              })}
              {loadingLLM && (
                <div className="px-10 py-3 text-sm text-white/70 border-t border-white/10">Refining with AI…</div>
              )}
            </div>
          )}
        </form>

        {/* Center: PM Title - sits between input and send */}
        <h1 className="text-white text-8xl font-semibold tracking-wide select-none">PM</h1>

        {/* Right: Glass Send Button */}
        <button
          type="button"
          onClick={handleClick}
          className="relative w-16 h-16 flex items-center justify-center bg-black/30 backdrop-blur-xl ring-1 ring-white/25 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.35)] hover:bg-white/15 active:scale-95 transition"
          aria-label="Send"
        >
          <GlowingEffect
            variant="white"
            glow={true}
            disabled={false}
            proximity={64}
            spread={40}
            inactiveZone={0.01}
          />
          <Send className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
