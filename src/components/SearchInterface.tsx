import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Send, Code, Twitter, Telegram, Github, Instagram, NavArrowRight } from 'iconoir-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { Bouncy } from 'ldrs/react';
import 'ldrs/react/Bouncy.css';
// Load socials and projects from src/data at build-time
import socialsYamlRaw from '../data/socials.yaml?raw';
import projectsYamlRaw from '../data/projects.yaml?raw';

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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
    type: 'social' | 'project';
    description?: string;
    image?: string;
    tech?: string[];
  };

  const IconById: Record<string, (props: { className?: string }) => ReactElement> = {
    twitter: (p) => <Twitter className={p.className} />,
    telegram: (p) => <Telegram className={p.className} />,
    github: (p) => <Github className={p.className} />,
    instagram: (p) => <Instagram className={p.className} />,
    project: (p) => <Code className={p.className} />,
  };

  // very small YAML parser for our flat list structure (src/data/socials.yaml or public/socials.yaml)
  function parseSocialYaml(text: string): SocialItem[] {
    const lines = text.split(/\r?\n/);
    const items: SocialItem[] = [];
    let current: Partial<SocialItem> | null = null;
    for (const raw of lines) {
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
          (current as Record<string, string>)[k] = v;
        }
        continue;
      }
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (m && current) {
        const key = m[1];
        let val = m[2];
        // strip quotes if any
        val = val.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        (current as Record<string, string>)[key] = val;
      }
    }
    if (current) {
      if (current.id && current.name && current.username && current.icon && current.url) {
        items.push(current as SocialItem);
      }
    }
    return items;
  }

  // YAML parser for projects structure
  function parseProjectsYaml(text: string): SocialItem[] {
    const lines = text.split(/\r?\n/);
    const items: SocialItem[] = [];
    let inProjects = false;
    let current: Partial<SocialItem> | null = null;
    
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      
      if (line.startsWith('projects:')) {
        inProjects = true;
        continue;
      }
      
      if (line.startsWith('ui:') || line.startsWith('fourthRight:') || line.startsWith('base:') || line.startsWith('exit:') || line.startsWith('scroll:') || line.startsWith('cards:')) {
        inProjects = false;
        continue;
      }
      
      if (inProjects && line.startsWith('- name:')) {
        if (current) {
          if (current.name && current.url) {
            items.push({
              id: current.name.toLowerCase().replace(/\s+/g, '-'),
              name: current.name,
              username: '',
              icon: 'project',
              url: current.url,
              type: 'project',
              description: current.description,
              image: current.image,
              tech: current.tech,
            } as SocialItem);
          }
        }
        current = { name: line.slice(7).trim(), type: 'project' as const };
        continue;
      }
      
      if (inProjects && current) {
        if (line.startsWith('description:')) {
          current.description = line.slice(12).trim();
        } else if (line.startsWith('image:')) {
          current.image = line.slice(7).trim();
        } else if (line.startsWith('url:')) {
          current.url = line.slice(4).trim();
        } else if (line.startsWith('tech:')) {
          // 简单的数组解析
          const techMatch = line.match(/tech:\s*\[(.*?)\]/);
          if (techMatch) {
            current.tech = techMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
          }
        }
      }
    }
    
    if (current && current.name && current.url) {
      items.push({
        id: current.name.toLowerCase().replace(/\s+/g, '-'),
        name: current.name,
        username: '',
        icon: 'project',
        url: current.url,
        type: 'project',
        description: current.description,
        image: current.image,
        tech: current.tech,
      } as SocialItem);
    }
    
    return items;
  }

  async function loadData() {
    try {
      // Load socials data
      if (!(typeof socialsYamlRaw === 'string' && socialsYamlRaw.length > 0)) {
        throw new Error('socials.yaml is missing or empty under src/data');
      }
      const socialItems = parseSocialYaml(socialsYamlRaw);
      
      // Load projects data
      if (!(typeof projectsYamlRaw === 'string' && projectsYamlRaw.length > 0)) {
        throw new Error('projects.yaml is missing or empty under src/data');
      }
      const projectItems = parseProjectsYaml(projectsYamlRaw);
      
      // Combine all items
      const allItems = [...socialItems, ...projectItems];
      setSocials(allItems);
      setSuggestions(allItems);
    } catch (e) {
      console.error('Failed to load data from src/data', e);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // local lightweight similarity as fallback
  function localRank(q: string, items: SocialItem[]): SocialItem[] {
    const s = q.toLowerCase();
    const scored = items.map((it) => {
      const hay = `${it.name} ${it.id} ${it.username} ${it.description || ''} ${it.tech?.join(' ') || ''}`.toLowerCase();
      let score = 0;
      if (hay.startsWith(s)) score += 3;
      if (hay.includes(s)) score += 1;
      if (it.name.toLowerCase().startsWith(s)) score += 2;
      if (it.description && it.description.toLowerCase().includes(s)) score += 2;
      return { it, score };
    });
    return scored.sort((a, b) => b.score - a.score).map((x) => x.it);
  }

  async function llmRank(q: string, items: SocialItem[]): Promise<SocialItem[] | null> {
    const enableAISearch = import.meta.env.VITE_ENABLE_AI_SEARCH === 'true';
    if (!enableAISearch) return null;

    const key = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    const baseURL = import.meta.env.VITE_OPENAI_BASE_URL as string | undefined || 'https://api.openai.com/v1';
    const model = import.meta.env.VITE_OPENAI_MODEL as string | undefined || 'gpt-4o-mini';
    
    if (!key) return null;

    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoadingLLM(true);

      // 构建完整的上下文，包含所有YAML数据
      const context = `
SOCIAL LINKS:
${socialsYamlRaw}

PROJECTS:
${projectsYamlRaw}
`;

      const system = `You are an intelligent search assistant for a personal website. Given a user query and the complete data context (social links and projects), find and rank the most relevant matches.

Your task:
1. Analyze the user's query against all available data (social links and projects)
2. Return a JSON array of results sorted by relevance
3. Each result should include: id, name, type, description (if available), and a relevance score (1-10)
4. Only return items that are actually relevant to the query
5. For projects, consider descriptions and technologies
6. For social links, consider names and usernames

Return exactly this JSON structure:
{
  "results": [
    {
      "id": "string",
      "name": "string", 
      "type": "social" | "project",
      "description": "string (if available)",
      "score": number
    }
  ]
}`;

      const user = {
        query: q,
        context: context,
        available_items: items.map((x) => ({
          id: x.id,
          name: x.name,
          type: x.type,
          description: x.description,
          username: x.username,
          tech: x.tech
        }))
      };

      const resp = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: model,
          temperature: 0,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: `Query: ${user.query}\n\nContext:\n${user.context}\n\nAvailable Items:\n${JSON.stringify(user.available_items, null, 2)}` },
          ],
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(text) as { results?: { id: string; score: number }[] };
      const results = parsed.results ?? [];
      
      if (!results.length) return null;
      
      // 按分数排序并获取项目
      const sortedResults = results.sort((a, b) => b.score - a.score);
      const map = new Map(items.map((x) => [x.id, x] as const));
      const ranked: SocialItem[] = [];
      
      for (const result of sortedResults) {
        const hit = map.get(result.id);
        if (hit) ranked.push(hit);
      }
      
      // 如果没有找到匹配的结果，返回本地排序的结果
      if (!ranked.length) {
        return localRank(q, items);
      }
      
      return ranked;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 请求被取消是正常行为，不需要记录警告
        return null;
      }
      console.warn('LLM rank failed, fallback to local', err);
      return null;
    } finally {
      setLoadingLLM(false);
    }
  }

  // Handle item selection
  const handleSelectItem = (item: SocialItem) => {
    setSelectedItem(item);
    const displayText = item.type === 'project' 
      ? item.name 
      : `${item.name} (${item.username})`;
    setQuery(displayText);
    setSuggestions([]); // Clear suggestions dropdown
    setHighlightedIndex(-1);
  };

  // recompute suggestions on query change with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
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
    
    // 防抖：300ms 后执行搜索
    debounceRef.current = setTimeout(run, 300);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
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
                  const Icon = IconById[selectedItem.icon] ?? ((p: { className?: string }) => <Code {...p} />);
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
                const Icon = IconById[s.icon] ?? ((p: { className?: string }) => <Code {...p} />);
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
                      <div className="ml-3 flex-1 flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-white whitespace-nowrap">{s.name}</span>
                          {s.type === 'social' && (
                            <span className="text-white/60 whitespace-nowrap">{s.username}</span>
                          )}
                        </div>
                        {s.description && (
                          <span className="text-white/60 text-sm line-clamp-1">{s.description}</span>
                        )}
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
                <div className="flex items-center justify-center gap-3 px-6 py-4 text-sm text-white/70 border-t border-white/10">
                  <Bouncy
                    size="20"
                    speed="1.75"
                    color="rgba(255, 255, 255, 0.7)"
                  />
                  <span>Refining with AI…</span>
                </div>
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
