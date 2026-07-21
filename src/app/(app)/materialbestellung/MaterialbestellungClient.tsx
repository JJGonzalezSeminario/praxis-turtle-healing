'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingCart, List, Search, Plus, Printer,
  CheckCircle2, AlertCircle, X, Check, Trash2, Hash, Clock,
  ChevronDown, ChevronRight, ExternalLink, Package, Pill, Pencil, Save,
  Minus, TrendingDown, BoxSelect
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = ['Alle', 'Medizinisch', 'Medikamente – Arnika', 'Medikamente – Viktoria', 'Verbandmaterial', 'Büro', 'Reinigung', 'Sonstiges']

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bgColor: string; borderColor: string; headerBg: string }> = {
  'Medikamente – Arnika': {
    icon: Pill,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    headerBg: 'bg-emerald-50/80',
  },
  'Medikamente – Viktoria': {
    icon: Pill,
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    headerBg: 'bg-violet-50/80',
  },
  'Medizinisch': {
    icon: Package,
    color: 'text-sky-700',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    headerBg: 'bg-sky-50/80',
  },
  'Verbandmaterial': {
    icon: Package,
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    headerBg: 'bg-rose-50/80',
  },
  'Büro': {
    icon: Package,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    headerBg: 'bg-amber-50/80',
  },
  'Reinigung': {
    icon: Package,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    headerBg: 'bg-teal-50/80',
  },
  'Sonstiges': {
    icon: Package,
    color: 'text-zinc-600',
    bgColor: 'bg-zinc-50',
    borderColor: 'border-zinc-200',
    headerBg: 'bg-zinc-50/80',
  },
}

const DEFAULT_CATEGORY_CONFIG = CATEGORY_CONFIG['Sonstiges']

interface InventoryItem {
  id: string
  name: string
  category: string
  pzn: string | null
  status: string
  min_stock: number
  current_stock: number
  shop_url: string | null
}

interface Props {
  initialInventory: InventoryItem[]
  initialOrders: any[]
  isAdmin: boolean
  userId: string
}

// ─── Inline-Bestandsanzeige mit +/- Buttons ──────────────────────────────────
function StockCounter({
  value,
  minStock,
  onChange,
}: {
  value: number
  minStock: number
  onChange: (v: number) => void
}) {
  const isCritical = value <= minStock
  return (
    <div className={cn(
      'flex items-center gap-1 rounded-xl border px-2 py-1 transition-colors',
      isCritical ? 'border-rose-300 bg-rose-50' : 'border-zinc-200 bg-zinc-50'
    )}>
      <button
        type='button'
        onClick={() => onChange(Math.max(0, value - 1))}
        className={cn(
          'w-6 h-6 rounded-lg flex items-center justify-center transition-colors font-bold text-sm',
          isCritical
            ? 'text-rose-600 hover:bg-rose-200'
            : 'text-zinc-500 hover:bg-zinc-200'
        )}
      >
        <Minus size={12} strokeWidth={3} />
      </button>
      <input
        type='number'
        min='0'
        value={value}
        onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className={cn(
          'w-10 text-center text-sm font-extrabold bg-transparent outline-none',
          isCritical ? 'text-rose-700' : 'text-zinc-800'
        )}
      />
      <button
        type='button'
        onClick={() => onChange(value + 1)}
        className={cn(
          'w-6 h-6 rounded-lg flex items-center justify-center transition-colors font-bold text-sm',
          isCritical
            ? 'text-rose-600 hover:bg-rose-200'
            : 'text-zinc-500 hover:bg-zinc-200'
        )}
      >
        <Plus size={12} strokeWidth={3} />
      </button>
    </div>
  )
}

// ─── Kategorie-Sektion (Accordion) ───────────────────────────────────────────
function CategorySection({
  category,
  items,
  onToggle,
  onDelete,
  onEdit,
  onStockChange,
  defaultOpen,
}: {
  category: string
  items: InventoryItem[]
  onToggle: (id: string, status: string) => void
  onDelete: (id: string) => void
  onEdit: (item: InventoryItem) => void
  onStockChange: (id: string, newStock: number) => void
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const cfg = CATEGORY_CONFIG[category] ?? DEFAULT_CATEGORY_CONFIG
  const Icon = cfg.icon
  const criticalCount = items.filter(i => i.status === 'offen').length
  const shopUrl = items.find(i => i.shop_url)?.shop_url

  return (
    <div className={cn('rounded-2xl border overflow-hidden', cfg.borderColor)}>
      {/* Section Header */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 transition hover:brightness-95',
          cfg.headerBg
        )}
      >
        <div className='flex items-center gap-3'>
          <div className={cn('p-2 rounded-xl', cfg.bgColor, cfg.color)}>
            <Icon size={18} />
          </div>
          <div className='text-left'>
            <span className={cn('font-extrabold text-base', cfg.color)}>{category}</span>
            <div className='flex items-center gap-2 mt-0.5'>
              <span className='text-xs font-medium text-zinc-400'>{items.length} Artikel</span>
              {criticalCount > 0 && (
                <span className='flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full'>
                  <AlertCircle size={10} />
                  {criticalCount} auf der Liste
                </span>
              )}
            </div>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          {shopUrl && (
            <a
              href={shopUrl}
              target='_blank'
              rel='noopener noreferrer'
              onClick={e => e.stopPropagation()}
              className={cn(
                'hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition hover:scale-105',
                cfg.bgColor, cfg.color, cfg.borderColor
              )}
            >
              <ExternalLink size={12} />
              Online-Shop öffnen
            </a>
          )}
          {open
            ? <ChevronDown size={20} className='text-zinc-400' />
            : <ChevronRight size={20} className='text-zinc-400' />
          }
        </div>
      </button>

      {/* Items List */}
      {open && (
        <div className='divide-y divide-zinc-100 bg-white'>
          {/* Column headers */}
          <div className='px-5 py-2 grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] gap-4 items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wide bg-zinc-50/60'>
            <span className='hidden sm:block'>Status</span>
            <span>Artikel</span>
            <span className='text-center'>Bestand</span>
            <span className='hidden sm:block'></span>
          </div>
          {items.map(item => {
            const isCritical = item.status === 'offen'
            return (
              <div
                key={item.id}
                className={cn(
                  'px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition hover:bg-zinc-50 group',
                  isCritical && 'bg-rose-50/40'
                )}
              >
                {/* Toggle + Name */}
                <div className='flex items-center gap-4 flex-1 min-w-0'>
                  <button
                    onClick={() => onToggle(item.id, item.status)}
                    className={cn(
                      'w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                      isCritical
                        ? 'bg-rose-500 border-rose-500 text-white'
                        : 'border-zinc-300 bg-white hover:border-amber-500'
                    )}
                    title={isCritical ? 'Von der Liste nehmen' : 'Auf die Einkaufsliste setzen'}
                  >
                    {isCritical && <Check size={14} strokeWidth={4} />}
                  </button>

                  <div className='min-w-0 flex-1'>
                    <h3 className={cn('text-sm font-bold truncate', isCritical ? 'text-rose-900' : 'text-zinc-900')}>
                      {item.name}
                    </h3>
                    <div className='flex flex-wrap items-center gap-2 mt-0.5'>
                      {item.pzn && (
                        <span className='text-[10px] font-mono text-zinc-400'>
                          PZN: {item.pzn}
                        </span>
                      )}
                      <span className='text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 shadow-sm'>
                        <Hash size={9} /> Min: {item.min_stock || 1}
                      </span>
                      {item.shop_url && (
                        <a
                          href={item.shop_url}
                          target='_blank'
                          rel='noopener noreferrer'
                          onClick={e => e.stopPropagation()}
                          className='text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 hover:bg-indigo-100 transition-colors'
                        >
                          <ExternalLink size={9} /> Shop
                        </a>
                      )}
                      {isCritical && (
                        <span className='text-[10px] font-bold text-rose-500 flex items-center gap-0.5'>
                          <AlertCircle size={10} /> Auf der Einkaufsliste
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock counter + actions */}
                <div className='flex items-center gap-3 ml-10 sm:ml-0'>
                  <div onClick={e => e.stopPropagation()}>
                    <StockCounter
                      value={item.current_stock}
                      minStock={item.min_stock}
                      onChange={v => onStockChange(item.id, v)}
                    />
                  </div>
                  <div className='flex items-center gap-1 shrink-0'>
                    <button
                      onClick={() => onEdit(item)}
                      className='p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'
                      title='Bearbeiten'
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className='p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors'
                      title='Löschen'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────
export function MaterialbestellungClient({ initialInventory, initialOrders, isAdmin, userId }: Props) {
  const supabase = createClient()

  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [orderHistory, setOrderHistory] = useState<any[]>(initialOrders)

  const [activeTab, setActiveTab] = useState<'lager' | 'bestellung' | 'historie'>('lager')
  const [searchQuery, setSearchQuery] = useState('')
  const [manualEntry, setManualEntry] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', category: 'Medizinisch', pzn: '', min_stock: 1, current_stock: 0, shop_url: '' })

  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [editForm, setEditForm] = useState({ name: '', category: '', pzn: '', min_stock: 1, current_stock: 0, shop_url: '' })

  // Bestellmengen: Map<itemId, qty> – nur im lokalen State, nicht in DB
  const [orderQty, setOrderQty] = useState<Record<string, number>>({})

  // ── Hilfsfunktion: Bestellmenge vorschlagen ──────────────────────────────
  const suggestQty = useCallback((item: InventoryItem) => {
    const need = (item.min_stock || 1) - item.current_stock
    return Math.max(1, need)
  }, [])

  // ── Bestand ändern & ggf. Status automatisch setzen ─────────────────────
  const handleStockChange = async (id: string, newStock: number) => {
    const item = inventory.find(i => i.id === id)
    if (!item) return

    const needsOrder = newStock <= item.min_stock
    const newStatus = needsOrder ? 'offen' : 'ok'

    setInventory(prev =>
      prev.map(i => i.id === id ? { ...i, current_stock: newStock, status: newStatus } : i)
    )

    await supabase
      .from('inventory')
      .update({ current_stock: newStock, status: newStatus })
      .eq('id', id)
  }

  const openEdit = (item: InventoryItem) => {
    setEditItem(item)
    setEditForm({
      name: item.name,
      category: item.category,
      pzn: item.pzn || '',
      min_stock: item.min_stock || 1,
      current_stock: item.current_stock ?? 0,
      shop_url: item.shop_url || '',
    })
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return

    const needsOrder = editForm.current_stock <= editForm.min_stock
    const updated = {
      name: editForm.name,
      category: editForm.category,
      pzn: editForm.pzn || null,
      min_stock: editForm.min_stock,
      current_stock: editForm.current_stock,
      status: needsOrder ? 'offen' : 'ok',
      shop_url: editForm.shop_url || null,
    }
    const { error } = await supabase.from('inventory').update(updated).eq('id', editItem.id)
    if (!error) {
      setInventory(inventory.map(i => i.id === editItem.id ? { ...i, ...updated } : i))
      setEditItem(null)
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ok' ? 'offen' : 'ok'
    setInventory(inventory.map(i => i.id === id ? { ...i, status: newStatus } : i))
    await supabase.from('inventory').update({ status: newStatus }).eq('id', id)
  }

  const handleDelivered = async (item: InventoryItem) => {
    // Bestand auf min_stock setzen und Status auf ok
    const newStock = item.min_stock
    if (item.category === 'Sonstiges' && !item.pzn) {
      setInventory(inventory.filter(i => i.id !== item.id))
      await supabase.from('inventory').delete().eq('id', item.id)
    } else {
      setInventory(prev =>
        prev.map(i => i.id === item.id ? { ...i, status: 'ok', current_stock: newStock } : i)
      )
      await supabase
        .from('inventory')
        .update({ status: 'ok', current_stock: newStock })
        .eq('id', item.id)
    }
  }

  const addManualEntry = async () => {
    if (!manualEntry.trim()) return
    const newDoc = { name: manualEntry, category: 'Sonstiges', pzn: '', status: 'offen', min_stock: 1, current_stock: 0, shop_url: null }
    const { data } = await supabase.from('inventory').insert([newDoc]).select()
    if (data) {
      setInventory([...inventory, data[0]])
      setManualEntry('')
    }
  }

  const addNewItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name) return

    const needsOrder = newItem.current_stock <= newItem.min_stock

    const { data } = await supabase.from('inventory').insert([{
      name: newItem.name,
      category: newItem.category,
      pzn: newItem.pzn || null,
      status: needsOrder ? 'offen' : 'ok',
      min_stock: newItem.min_stock,
      current_stock: newItem.current_stock,
      shop_url: newItem.shop_url || null,
    }]).select()

    if (data) {
      setInventory([...inventory, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
      setIsModalOpen(false)
      setNewItem({ name: '', category: 'Medizinisch', pzn: '', min_stock: 1, current_stock: 0, shop_url: '' })
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Diesen Artikel komplett aus dem System löschen?')) return
    setInventory(inventory.filter(i => i.id !== id))
    await supabase.from('inventory').delete().eq('id', id)
  }

  const orderItems = inventory.filter(item => item.status === 'offen')

  // Bestellmenge für einen Artikel ermitteln (Fallback: Vorschlag)
  const getQty = (item: InventoryItem) => orderQty[item.id] ?? suggestQty(item)

  const setQty = (id: string, qty: number) => {
    setOrderQty(prev => ({ ...prev, [id]: Math.max(1, qty) }))
  }

  const createAndPrintOrderList = async () => {
    if (orderItems.length === 0) return
    const itemsSnapshot = orderItems.map(i => ({
      name: i.name,
      pzn: i.pzn,
      category: i.category,
      qty: getQty(i),
    }))
    const { data, error } = await supabase.from('material_orders').insert([{
      user_id: userId,
      items: itemsSnapshot
    }]).select('id, created_at, items, profiles(full_name)')

    if (!error && data) {
      setOrderHistory([data[0], ...orderHistory])
      window.print()
    } else {
      alert('Fehler beim Protokollieren: ' + error?.message)
    }
  }

  // Group items by category for accordion view
  const filteredInventory = searchQuery
    ? inventory.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.pzn && item.pzn.includes(searchQuery))
      )
    : inventory

  const categoriesInUse = Array.from(new Set(inventory.map(i => i.category))).sort()

  const groupedInventory = categoriesInUse.reduce<Record<string, InventoryItem[]>>((acc, cat) => {
    const items = filteredInventory.filter(i => i.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  const criticalCategoriesOpen = new Set(
    categoriesInUse.filter(cat =>
      (groupedInventory[cat] || []).some(i => i.status === 'offen')
    )
  )

  return (
    <div className='max-w-6xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500 print:p-0 print:m-0'>

      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden'>
        <div>
          <h1 className='text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3'>
            <div className='p-3 bg-amber-100 text-amber-700 rounded-2xl'>
              <ShoppingCart size={28} />
            </div>
            Materialbestellung
          </h1>
          <p className='text-zinc-500 font-medium mt-2'>
            Praxis-Bestand verwalten und Einkaufsliste generieren.
          </p>
        </div>

        <div className='flex gap-2 w-full sm:w-auto'>
          <button
            onClick={() => setIsModalOpen(true)}
            className='flex-1 sm:flex-none bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-3 rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2'
          >
            <Plus size={18} strokeWidth={3} /> <span className='hidden sm:inline'>Neuer Artikel</span>
          </button>

          {activeTab === 'bestellung' && orderItems.length > 0 && (
            <button
              onClick={createAndPrintOrderList}
              className='flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2'
            >
              <Printer size={18} /> Liste drucken & protokollieren
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className='flex bg-zinc-100 p-1.5 rounded-2xl max-w-xl mb-8 overflow-x-auto custom-scrollbar print:hidden'>
        <button
          onClick={() => setActiveTab('lager')}
          className={cn('flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap', activeTab === 'lager' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700')}
        >
          <List size={16} /> Lagerbestand
        </button>
        <button
          onClick={() => setActiveTab('bestellung')}
          className={cn('flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all relative flex items-center justify-center gap-2 whitespace-nowrap', activeTab === 'bestellung' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700')}
        >
          <ShoppingCart size={16} /> Einkaufsliste
          {orderItems.length > 0 && (
            <span className='absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-sm shadow-rose-500/50'></span>
          )}
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('historie')}
            className={cn('flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap', activeTab === 'historie' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700')}
          >
            <Clock size={16} /> Bestell-Historie
          </button>
        )}
      </div>

      {/* === TAB: LAGER (Accordion grouped) === */}
      {activeTab === 'lager' && (
        <div className='space-y-4 animate-in fade-in print:hidden'>

          {/* Info-Banner */}
          <div className='flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 text-sm text-amber-800'>
            <TrendingDown size={18} className='shrink-0 mt-0.5 text-amber-600' />
            <p className='font-medium'>
              Bestand über die <span className='font-extrabold'>+/−</span> Tasten anpassen.
              Sinkt der Bestand auf oder unter den Mindestbestand, landet der Artikel automatisch auf der Einkaufsliste.
            </p>
          </div>

          {/* Search bar */}
          <div className='relative group'>
            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
              <Search className='h-5 w-5 text-zinc-400 group-focus-within:text-amber-600 transition-colors' />
            </div>
            <input
              type='text'
              placeholder='Nach Artikel oder PZN suchen...'
              className='w-full pl-12 pr-4 py-3.5 bg-white border-2 border-zinc-200 rounded-2xl outline-none focus:border-amber-500 transition-all font-medium text-zinc-800 shadow-sm'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600'
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Search results flat list */}
          {searchQuery ? (
            <div className='bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm'>
              <div className='px-4 py-2 bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-500 uppercase tracking-wide'>
                {filteredInventory.length} Treffer
              </div>
              <div className='divide-y divide-zinc-100'>
                {filteredInventory.map(item => {
                  const isCritical = item.status === 'offen'
                  return (
                    <div key={item.id} className={cn('px-5 py-3.5 flex items-center justify-between gap-4 transition hover:bg-zinc-50 group', isCritical && 'bg-rose-50/40')}>
                      <div className='flex items-center gap-4 flex-1 min-w-0'>
                        <button
                          onClick={() => toggleStatus(item.id, item.status)}
                          className={cn('w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors', isCritical ? 'bg-rose-500 border-rose-500 text-white' : 'border-zinc-300 bg-white hover:border-amber-500')}
                        >
                          {isCritical && <Check size={14} strokeWidth={4} />}
                        </button>
                        <div className='min-w-0 flex-1'>
                          <p className={cn('text-sm font-bold truncate', isCritical ? 'text-rose-900' : 'text-zinc-900')}>{item.name}</p>
                          <div className='flex items-center gap-2 mt-0.5 flex-wrap'>
                            <span className='text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded'>{item.category}</span>
                            {item.pzn && <span className='text-[10px] font-mono text-zinc-400'>PZN: {item.pzn}</span>}
                            <span className='text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5'>
                              <Hash size={9} /> Min: {item.min_stock || 1}
                            </span>
                            {item.shop_url && (
                              <a href={item.shop_url} target='_blank' rel='noopener noreferrer' onClick={e => e.stopPropagation()}
                                className='text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 hover:bg-indigo-100 transition-colors'>
                                <ExternalLink size={9} /> Shop
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <StockCounter
                          value={item.current_stock}
                          minStock={item.min_stock}
                          onChange={v => handleStockChange(item.id, v)}
                        />
                        <div className='flex items-center gap-1 shrink-0'>
                          <button onClick={() => openEdit(item)} className='p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors' title='Bearbeiten'>
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => deleteItem(item.id)} className='p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors' title='Löschen'>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {filteredInventory.length === 0 && (
                  <div className='p-12 text-center text-zinc-400 font-medium'>Keine Artikel gefunden.</div>
                )}
              </div>
            </div>
          ) : (
            /* Accordion sections */
            <div className='space-y-3'>
              {Object.entries(groupedInventory).map(([cat, items]) => (
                <CategorySection
                  key={cat}
                  category={cat}
                  items={items}
                  onToggle={toggleStatus}
                  onDelete={deleteItem}
                  onEdit={openEdit}
                  onStockChange={handleStockChange}
                  defaultOpen={criticalCategoriesOpen.has(cat) || cat === categoriesInUse[0]}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* === TAB: BESTELLUNG === */}
      {activeTab === 'bestellung' && (
        <div className='space-y-6 animate-in fade-in'>
          <div className='bg-white p-3 rounded-2xl shadow-sm border border-zinc-200 flex flex-col sm:flex-row gap-2 print:hidden'>
            <input
              type='text'
              placeholder='Was fehlt noch? (Manueller Eintrag...)'
              className='flex-1 bg-zinc-50 border-none p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-zinc-800 font-medium'
              value={manualEntry}
              onChange={e => setManualEntry(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManualEntry()}
            />
            <button
              onClick={addManualEntry}
              className='bg-zinc-900 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-zinc-800 transition'
            >
              Hinzufügen
            </button>
          </div>

          <div className='hidden print:block mb-8 border-b-2 border-black pb-4'>
            <h2 className='text-3xl font-extrabold mb-1'>Einkaufs- &amp; Bestellliste</h2>
            <p className='text-zinc-500 font-bold'>Praxis Turtle-Healing | Stand: {new Date().toLocaleDateString('de-DE')}</p>
          </div>

          <div className='bg-white rounded-3xl shadow-sm overflow-hidden border border-zinc-200 print:shadow-none print:border-black'>
            <div className='bg-rose-50 text-rose-800 p-4 font-bold border-b border-rose-100 flex justify-between items-center print:hidden'>
              <span className='flex items-center gap-2'><AlertCircle size={18} /> Folgende Artikel müssen bestellt werden:</span>
              <span className='bg-white px-3 py-1 rounded-full text-xs shadow-sm'>{orderItems.length} Positionen</span>
            </div>

            {/* Column header for order list */}
            {orderItems.length > 0 && (
              <div className='px-5 py-2 grid grid-cols-[1fr_auto_auto] gap-4 items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wide bg-zinc-50/60 border-b border-zinc-100 print:hidden'>
                <span>Artikel</span>
                <span className='text-center'>Bestellmenge</span>
                <span></span>
              </div>
            )}

            <div className='divide-y divide-zinc-100 print:divide-zinc-300'>
              {orderItems.map(item => (
                <div key={item.id} className='p-5 flex flex-row items-center gap-4 transition hover:bg-zinc-50'>
                  <div className='hidden print:block w-6 h-6 border-2 border-zinc-400 rounded shrink-0'></div>

                  <div className='flex-1 min-w-0'>
                    <h3 className='text-base font-extrabold text-zinc-900'>{item.name}</h3>
                    <div className='flex items-center gap-3 mt-1 flex-wrap'>
                      <span className='text-xs font-bold text-zinc-500'>{item.category}</span>
                      {item.pzn && <span className='text-xs font-mono text-zinc-400'>PZN: {item.pzn}</span>}
                      <span className='hidden print:inline text-xs font-bold'>
                        Menge: {getQty(item)}
                      </span>
                      {item.shop_url && (
                        <a
                          href={item.shop_url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='hidden print:hidden sm:flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition'
                        >
                          <ExternalLink size={11} /> Shop
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Bestellmenge */}
                  <div className='shrink-0 print:hidden flex flex-col items-center gap-1'>
                    <div className='flex items-center gap-1.5 bg-zinc-100 rounded-xl px-2 py-1.5 border border-zinc-200'>
                      <button
                        type='button'
                        onClick={() => setQty(item.id, getQty(item) - 1)}
                        className='w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition font-bold shadow-sm'
                      >
                        <Minus size={13} strokeWidth={3} />
                      </button>
                      <input
                        type='number'
                        min='1'
                        value={getQty(item)}
                        onChange={e => setQty(item.id, parseInt(e.target.value) || 1)}
                        className='w-12 text-center text-sm font-extrabold bg-transparent outline-none text-zinc-800'
                        title='Bestellmenge'
                      />
                      <button
                        type='button'
                        onClick={() => setQty(item.id, getQty(item) + 1)}
                        className='w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition font-bold shadow-sm'
                      >
                        <Plus size={13} strokeWidth={3} />
                      </button>
                    </div>
                    <span className='text-[10px] text-zinc-400 font-medium'>Stück</span>
                  </div>

                  {/* Geliefert-Button */}
                  <div className='shrink-0 print:hidden'>
                    <button
                      onClick={() => handleDelivered(item)}
                      className='px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-600 hover:text-white transition flex items-center gap-2 text-sm'
                    >
                      <CheckCircle2 size={16} /> Geliefert
                    </button>
                  </div>
                </div>
              ))}
              {orderItems.length === 0 && (
                <div className='p-16 text-center text-zinc-400 font-medium text-lg print:hidden'>
                  Die Einkaufsliste ist leer. Alles im grünen Bereich! 🎉
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === TAB: HISTORIE === */}
      {activeTab === 'historie' && isAdmin && (
        <div className='space-y-6 animate-in fade-in print:hidden'>
          {orderHistory.length === 0 ? (
            <div className='bg-white rounded-3xl border border-zinc-200 p-16 text-center text-zinc-500 font-bold'>
              Noch keine Bestelllisten protokolliert.
            </div>
          ) : (
            <div className='grid gap-6'>
              {orderHistory.map(order => (
                <div key={order.id} className='bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm'>
                  <div className='bg-zinc-50 p-4 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2'>
                    <div>
                      <h3 className='font-extrabold text-zinc-900 flex items-center gap-2'>
                        <Clock size={16} className='text-amber-500' />
                        {new Date(order.created_at).toLocaleString('de-DE')} Uhr
                      </h3>
                      <p className='text-sm font-medium text-zinc-500 mt-0.5'>
                        Gedruckt &amp; bestellt von: <span className='text-zinc-800'>{order.profiles?.full_name || 'Mitarbeiter'}</span>
                      </p>
                    </div>
                    <span className='bg-white border border-zinc-200 text-zinc-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm'>
                      {order.items.length} Positionen
                    </span>
                  </div>
                  <div className='p-4 bg-white'>
                    <ul className='space-y-2'>
                      {order.items.map((item: any, idx: number) => (
                        <li key={idx} className='flex items-center gap-3 text-sm font-medium text-zinc-700'>
                          <span className='w-1.5 h-1.5 bg-amber-400 rounded-full'></span>
                          <span className='flex-1'>{item.name}</span>
                          {item.pzn && <span className='text-zinc-400 font-mono text-xs'>(PZN: {item.pzn})</span>}
                          {item.qty && (
                            <span className='text-xs font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full'>
                              {item.qty}×
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === MODAL: Neuer Artikel === */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in print:hidden' onClick={() => setIsModalOpen(false)}>
          <div className='bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-zinc-200 overflow-hidden flex flex-col' onClick={e => e.stopPropagation()}>
            <div className='flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50'>
              <h2 className='text-xl font-extrabold text-zinc-900 flex items-center gap-2'>
                <Plus className='text-amber-600' size={24} /> Neuen Artikel anlegen
              </h2>
              <button onClick={() => setIsModalOpen(false)} className='p-2 text-zinc-400 hover:bg-zinc-200 rounded-full transition'><X size={20} /></button>
            </div>

            <form onSubmit={addNewItem} className='p-6 space-y-4'>
              <div className='space-y-1'>
                <label className='text-xs font-bold text-zinc-500 uppercase'>Artikelbezeichnung *</label>
                <input type='text' required placeholder='z.B. Einmalspritzen 2ml' className='w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-amber-500 font-medium text-zinc-800 bg-white' value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-bold text-zinc-500 uppercase'>Kategorie</label>
                <select className='w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-amber-500 font-bold text-zinc-800 bg-white' value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                  {CATEGORIES.filter(c => c !== 'Alle').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <label className='text-xs font-bold text-zinc-500 uppercase'>PZN (Optional)</label>
                  <input type='text' placeholder='12345678' className='w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-amber-500 font-mono text-zinc-800 bg-white' value={newItem.pzn} onChange={e => setNewItem({ ...newItem, pzn: e.target.value })} />
                </div>
                <div className='space-y-1'>
                  <label className='text-xs font-bold text-zinc-500 uppercase'>Mindestbestand</label>
                  <input type='number' min='1' required className='w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-amber-500 font-medium text-zinc-800 bg-white' value={newItem.min_stock} onChange={e => setNewItem({ ...newItem, min_stock: parseInt(e.target.value) || 1 })} />
                </div>
              </div>

              {/* Aktueller Bestand – NEU */}
              <div className='space-y-1'>
                <label className='text-xs font-bold text-zinc-500 uppercase'>Aktueller Bestand</label>
                <div className='flex items-center gap-3 border-2 border-zinc-100 rounded-xl p-3 bg-white focus-within:border-amber-500 transition-colors'>
                  <BoxSelect size={16} className='text-zinc-400 shrink-0' />
                  <input
                    type='number'
                    min='0'
                    className='flex-1 outline-none font-medium text-zinc-800 bg-transparent'
                    placeholder='0'
                    value={newItem.current_stock}
                    onChange={e => setNewItem({ ...newItem, current_stock: parseInt(e.target.value) || 0 })}
                  />
                  <span className='text-xs text-zinc-400 font-medium shrink-0'>Stück</span>
                </div>
                {newItem.current_stock <= newItem.min_stock && (
                  <p className='text-xs text-rose-600 font-medium flex items-center gap-1'>
                    <AlertCircle size={11} /> Wird direkt auf die Einkaufsliste gesetzt
                  </p>
                )}
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-bold text-zinc-500 uppercase'>Shop-URL (Optional)</label>
                <input type='url' placeholder='https://www.apotheke.de' className='w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-amber-500 font-medium text-zinc-800 bg-white' value={newItem.shop_url} onChange={e => setNewItem({ ...newItem, shop_url: e.target.value })} />
              </div>

              <button type='submit' className='w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-transform active:scale-95 mt-4'>
                Im Lager speichern
              </button>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL: Artikel bearbeiten === */}
      {editItem && (
        <div className='fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in print:hidden' onClick={() => setEditItem(null)}>
          <div className='bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-zinc-200 overflow-hidden flex flex-col' onClick={e => e.stopPropagation()}>
            <div className='flex justify-between items-center p-6 border-b border-zinc-100 bg-indigo-50/50'>
              <h2 className='text-xl font-extrabold text-zinc-900 flex items-center gap-2'>
                <Pencil className='text-indigo-600' size={22} /> Artikel bearbeiten
              </h2>
              <button onClick={() => setEditItem(null)} className='p-2 text-zinc-400 hover:bg-zinc-200 rounded-full transition'><X size={20} /></button>
            </div>

            <form onSubmit={saveEdit} className='p-6 space-y-4'>
              <div className='space-y-1'>
                <label className='text-xs font-bold text-zinc-500 uppercase'>Artikelbezeichnung *</label>
                <input type='text' required className='w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-indigo-500 font-medium text-zinc-800 bg-white' value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-bold text-zinc-500 uppercase'>Kategorie</label>
                <select className='w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold text-zinc-800 bg-white' value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                  {CATEGORIES.filter(c => c !== 'Alle').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <label className='text-xs font-bold text-zinc-500 uppercase'>PZN (Optional)</label>
                  <input type='text' placeholder='12345678' className='w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-indigo-500 font-mono text-zinc-800 bg-white' value={editForm.pzn} onChange={e => setEditForm({ ...editForm, pzn: e.target.value })} />
                </div>
                <div className='space-y-1'>
                  <label className='text-xs font-bold text-zinc-500 uppercase'>Mindestbestand</label>
                  <input type='number' min='1' required className='w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-indigo-500 font-medium text-zinc-800 bg-white' value={editForm.min_stock} onChange={e => setEditForm({ ...editForm, min_stock: parseInt(e.target.value) || 1 })} />
                </div>
              </div>

              {/* Aktueller Bestand – NEU */}
              <div className='space-y-1'>
                <label className='text-xs font-bold text-zinc-500 uppercase'>Aktueller Bestand</label>
                <div className='flex items-center gap-3 border-2 border-zinc-100 rounded-xl p-3 bg-white focus-within:border-indigo-500 transition-colors'>
                  <BoxSelect size={16} className='text-zinc-400 shrink-0' />
                  <input
                    type='number'
                    min='0'
                    className='flex-1 outline-none font-medium text-zinc-800 bg-transparent'
                    placeholder='0'
                    value={editForm.current_stock}
                    onChange={e => setEditForm({ ...editForm, current_stock: parseInt(e.target.value) || 0 })}
                  />
                  <span className='text-xs text-zinc-400 font-medium shrink-0'>Stück</span>
                </div>
                {editForm.current_stock <= editForm.min_stock && (
                  <p className='text-xs text-rose-600 font-medium flex items-center gap-1'>
                    <AlertCircle size={11} /> Bestand ≤ Mindestbestand → auf Einkaufsliste
                  </p>
                )}
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-bold text-zinc-500 uppercase'>Shop-URL (Optional)</label>
                <input type='url' placeholder='https://www.apotheke.de' className='w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-indigo-500 font-medium text-zinc-800 bg-white' value={editForm.shop_url} onChange={e => setEditForm({ ...editForm, shop_url: e.target.value })} />
              </div>

              <button type='submit' className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-transform active:scale-95 mt-4 flex items-center justify-center gap-2'>
                <Save size={18} /> Änderungen speichern
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
