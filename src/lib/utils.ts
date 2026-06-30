import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Hilfsfunktion zur Sortierung von Schichten nach Rollen-Hierarchie:
// 1. Arzt (arzt)
// 2. Krankenschwester/Pflege (pflege)
// 3. Super-Admin / IT-Admin (super_admin / it_admin)
// 4. Physiotherapeut (physio)
// 5. Andere Rollen danach
export function sortShifts<T extends { profiles?: any }>(shifts: T[]): T[] {
  const roleWeights: Record<string, number> = {
    'arzt': 1,
    'pflege': 2,
    'super_admin': 3,
    'it_admin': 3,
    'physio': 4
  }

  return [...shifts].sort((a, b) => {
    const roleA = a.profiles?.roles?.slug || ''
    const roleB = b.profiles?.roles?.slug || ''
    
    const weightA = roleWeights[roleA] || 99
    const weightB = roleWeights[roleB] || 99

    if (weightA !== weightB) {
      return weightA - weightB
    }

    // Wenn gleicher Rang, alphabetisch nach dem Namen sortieren
    const nameA = a.profiles?.full_name || ''
    const nameB = b.profiles?.full_name || ''
    return nameA.localeCompare(nameB, 'de-DE')
  })
}
