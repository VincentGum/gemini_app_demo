
import React from 'react';

interface SidebarProps {
  inventory: string[];
  quest: string;
}

const Sidebar: React.FC<SidebarProps> = ({ inventory, quest }) => {
  return (
    <aside className="w-full md:w-80 bg-zinc-900 border-l border-zinc-800 p-6 overflow-y-auto flex flex-col gap-8 h-full">
      <section>
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-scroll text-yellow-500"></i> Current Quest
        </h3>
        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 shadow-inner">
          <p className="text-zinc-200 text-sm italic leading-relaxed">
            {quest || "No active quest."}
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-bag-shopping text-emerald-500"></i> Inventory
        </h3>
        {inventory.length > 0 ? (
          <ul className="space-y-2">
            {inventory.map((item, idx) => (
              <li 
                key={idx} 
                className="flex items-center gap-3 bg-zinc-800/30 p-2 rounded border border-transparent hover:border-zinc-700 transition-colors group"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                <span className="text-zinc-300 text-sm font-medium">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-600 text-sm italic">Empty-handed for now.</p>
        )}
      </section>
    </aside>
  );
};

export default Sidebar;
