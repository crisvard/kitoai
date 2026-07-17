import { useOtherNav } from '../contexts/OtherNavContext';
import BrowserView from './BrowserView';

export default function OtherDashboard() {
  const { activeNav, isGridMode, selectedNavs } = useOtherNav();

  const renderNavs = isGridMode ? selectedNavs : [activeNav];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#c4d82e]">Item ativo</p>
            <h3 className="text-xl font-semibold text-white">
              {isGridMode ? `${selectedNavs.length} navegadores selecionados` : activeNav}
            </h3>
          </div>
          <div className="rounded-xl bg-[#c4d82e]/15 p-3 text-[#c4d82e]">
            <span className="text-sm">Navegador{isGridMode && 's'}</span>
          </div>
        </div>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Cada NAV tem um navegador próprio rodando na VM do Google, 24 horas por dia.
          {isGridMode && ' No modo lado a lado, você pode ver múltiplos navegadores simultaneamente.'}
        </p>
      </div>

      <div className={`grid gap-4 ${isGridMode && renderNavs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {renderNavs.filter(Boolean).map(nav => (
          <BrowserView key={nav} navId={nav} />
        ))}
        {renderNavs.filter(Boolean).length === 0 && (
          <div className="flex h-[200px] items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <p className="text-gray-400">Nenhum navegador aberto. Clique em 'Adicionar +1' na lateral.</p>
          </div>
        )}
      </div>
    </section>
  );
}
