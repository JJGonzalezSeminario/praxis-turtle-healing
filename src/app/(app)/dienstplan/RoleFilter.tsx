'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function RoleFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentRole = searchParams.get('role') || 'alle'

  const roles = [
    { id: 'alle', label: 'Alle' },
    { id: 'arzt', label: 'Ärzte' },
    { id: 'pflege', label: 'Pflege/MFA' },
    { id: 'physio', label: 'Therapie' },
    { id: 'reinigung', label: 'Reinigung' },
  ]

  const handleFilter = (roleId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (roleId === 'alle') {
      params.delete('role')
    } else {
      params.set('role', roleId)
    }
    router.push(`/dienstplan?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200/50">
      {roles.map((role) => (
        <Button
          key={role.id}
          variant="ghost"
          size="sm"
          onClick={() => handleFilter(role.id)}
          className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
            currentRole === role.id
              ? 'bg-white text-zinc-900 shadow-sm font-semibold'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-transparent'
          }`}
        >
          {role.label}
        </Button>
      ))}
    </div>
  )
}