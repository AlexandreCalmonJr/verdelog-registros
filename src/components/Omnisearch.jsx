import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ClipboardList, Monitor, User as UserIcon } from 'lucide-react';

export default function Omnisearch({ tickets = [], equipment = [], onSelectResult }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState({ tickets: [], equipment: [] });
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tickets: [], equipment: [] });
      return;
    }

    const lowerQuery = query.toLowerCase();

    const matchedTickets = tickets.filter(t => 
      (t.ref && t.ref.toLowerCase().includes(lowerQuery)) ||
      (t.cliente && t.cliente.toLowerCase().includes(lowerQuery)) ||
      (t.requester && t.requester.toLowerCase().includes(lowerQuery)) ||
      (t.description && t.description.toLowerCase().includes(lowerQuery))
    ).slice(0, 5);

    const matchedEquipment = equipment.filter(e => 
      (e.name && e.name.toLowerCase().includes(lowerQuery)) ||
      (e.patrimony_number && e.patrimony_number.toLowerCase().includes(lowerQuery)) ||
      (e.assigned_user_name && e.assigned_user_name.toLowerCase().includes(lowerQuery))
    ).slice(0, 5);

    setResults({ tickets: matchedTickets, equipment: matchedEquipment });
  }, [query, tickets, equipment]);

  const hasResults = results.tickets.length > 0 || results.equipment.length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md z-[200]">
      <div className="relative flex items-center">
        <Search className="absolute left-3 text-text-muted" size={16} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar chamados, equipamentos..."
          className="w-full bg-surface2 border border-border rounded-full py-2 pl-10 pr-10 text-sm focus:border-green outline-none transition-all text-text"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-3 text-text-muted hover:text-text"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full mt-2 w-full bg-surface border border-border rounded-xl shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
          {!hasResults ? (
            <div className="p-4 text-center text-sm text-text-muted">
              Nenhum resultado encontrado para "{query}"
            </div>
          ) : (
            <div className="py-2">
              {results.tickets.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-[0.65rem] font-bold text-text-muted uppercase tracking-wider bg-surface2/50">Chamados</div>
                  {results.tickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectResult({ type: 'ticket', data: t });
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-surface2 transition-colors flex flex-col"
                    >
                      <div className="flex items-center gap-2">
                        <ClipboardList size={14} className="text-green" />
                        <span className="font-mono text-xs text-green">#{t.ref}</span>
                        <span className="text-xs text-text truncate">{t.cliente || t.requester}</span>
                      </div>
                      <span className="text-[0.7rem] text-text-muted truncate mt-1 pl-5">{t.description}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.equipment.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[0.65rem] font-bold text-text-muted uppercase tracking-wider bg-surface2/50">Equipamentos</div>
                  {results.equipment.map(e => (
                    <button
                      key={e.id}
                      onClick={() => {
                        onSelectResult({ type: 'equipment', data: e });
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-surface2 transition-colors flex flex-col"
                    >
                      <div className="flex items-center gap-2">
                        <Monitor size={14} className="text-blue" />
                        <span className="text-xs text-text font-medium">{e.name}</span>
                        {e.patrimony_number && <span className="text-[0.65rem] bg-surface2 px-1.5 py-0.5 rounded text-text-muted">{e.patrimony_number}</span>}
                      </div>
                      {e.assigned_user_name && (
                        <span className="text-[0.7rem] text-text-muted truncate mt-1 pl-5 flex items-center gap-1">
                          <UserIcon size={10} /> {e.assigned_user_name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
