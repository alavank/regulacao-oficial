const statusConfig: Record<string, { label: string; className: string }> = {
  aberto: { label: 'Aberto', className: 'bg-blue-100 text-blue-800' },
  em_analise: { label: 'Em Análise', className: 'bg-yellow-100 text-yellow-800' },
  em_andamento: { label: 'Em Andamento', className: 'bg-purple-100 text-purple-800' },
  concluido: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
  cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
  devolvido: { label: 'Devolvido', className: 'bg-gray-100 text-gray-800' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

const corConfig: Record<string, { label: string; className: string }> = {
  verde: { label: 'Normal', className: 'bg-emerald-100 text-emerald-800' },
  amarelo: { label: 'Atenção', className: 'bg-amber-100 text-amber-800' },
  vermelho: { label: 'Urgente', className: 'bg-red-100 text-red-800' },
}

export function CorBadge({ cor }: { cor: string }) {
  const config = corConfig[cor] || { label: cor, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: cor === 'verde' ? '#10B981' : cor === 'amarelo' ? '#F59E0B' : '#EF4444' }}
      />
      {config.label}
    </span>
  )
}
