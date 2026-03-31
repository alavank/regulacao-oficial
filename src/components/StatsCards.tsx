import type { DashboardStats } from '../types'
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChartBar,
} from 'react-icons/hi2'

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    { label: 'Total', valor: stats.total, icon: HiOutlineDocumentText, cor: 'bg-blue-50 text-blue-600' },
    { label: 'Abertos', valor: stats.abertos, icon: HiOutlineClock, cor: 'bg-yellow-50 text-yellow-600' },
    { label: 'Em Andamento', valor: stats.em_andamento, icon: HiOutlineChartBar, cor: 'bg-purple-50 text-purple-600' },
    { label: 'Concluídos', valor: stats.concluidos, icon: HiOutlineCheckCircle, cor: 'bg-green-50 text-green-600' },
    { label: 'Cancelados', valor: stats.cancelados, icon: HiOutlineXCircle, cor: 'bg-red-50 text-red-600' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map(c => (
        <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${c.cor}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{c.valor}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </div>
        </div>
      ))}
      {stats.tmat_medio && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <HiOutlineClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.tmat_medio}</p>
              <p className="text-xs text-gray-500">TMAT Médio</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
