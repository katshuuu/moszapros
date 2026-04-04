import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseConfigured, query } from '@/lib/db'

export interface PreferenceNode {
  id: string
  type: 'user' | 'category' | 'brand' | 'characteristic' | 'ste'
  label: string
  weight: number
  metadata?: Record<string, unknown>
}

export interface PreferenceEdge {
  source: string
  target: string
  weight: number
  interactionType: 'purchase' | 'view' | 'click' | 'favorite' | 'search'
  count: number
}

export interface PreferenceGraph {
  nodes: PreferenceNode[]
  edges: PreferenceEdge[]
  summary: {
    topCategories: { name: string; weight: number; count: number }[]
    topBrands: { name: string; weight: number; count: number }[]
    topCharacteristics: { name: string; weight: number }[]
    totalInteractions: number
    personalizationStrength: number
  }
}

// Демо данные для fallback режима
const demoPreferences: Record<string, PreferenceGraph> = {
  '7710140679': {
    nodes: [
      { id: 'user', type: 'user', label: 'ГБУЗ "Городская поликлиника №1"', weight: 1 },
      { id: 'cat_medical', type: 'category', label: 'Медицинское оборудование', weight: 0.85 },
      { id: 'cat_consumables', type: 'category', label: 'Расходные материалы', weight: 0.72 },
      { id: 'cat_pharma', type: 'category', label: 'Медикаменты', weight: 0.65 },
      { id: 'brand_medtech', type: 'brand', label: 'МедТех', weight: 0.78 },
      { id: 'brand_zdravmed', type: 'brand', label: 'ЗдравМед', weight: 0.62 },
      { id: 'char_sterile', type: 'characteristic', label: 'Стерильность', weight: 0.9 },
      { id: 'char_cert', type: 'characteristic', label: 'Сертификация', weight: 0.85 },
      { id: 'char_warranty', type: 'characteristic', label: 'Гарантия 2+ года', weight: 0.7 },
      { id: 'ste_1', type: 'ste', label: 'Шприц одноразовый 5мл', weight: 0.88 },
      { id: 'ste_2', type: 'ste', label: 'Перчатки латексные', weight: 0.82 },
      { id: 'ste_3', type: 'ste', label: 'Тонометр автоматический', weight: 0.75 },
    ],
    edges: [
      { source: 'user', target: 'cat_medical', weight: 0.85, interactionType: 'purchase', count: 28 },
      { source: 'user', target: 'cat_consumables', weight: 0.72, interactionType: 'purchase', count: 45 },
      { source: 'user', target: 'cat_pharma', weight: 0.65, interactionType: 'purchase', count: 12 },
      { source: 'cat_medical', target: 'brand_medtech', weight: 0.78, interactionType: 'purchase', count: 15 },
      { source: 'cat_consumables', target: 'brand_zdravmed', weight: 0.62, interactionType: 'purchase', count: 20 },
      { source: 'cat_medical', target: 'char_sterile', weight: 0.9, interactionType: 'view', count: 85 },
      { source: 'cat_medical', target: 'char_cert', weight: 0.85, interactionType: 'click', count: 42 },
      { source: 'brand_medtech', target: 'char_warranty', weight: 0.7, interactionType: 'view', count: 18 },
      { source: 'cat_consumables', target: 'ste_1', weight: 0.88, interactionType: 'purchase', count: 12 },
      { source: 'cat_consumables', target: 'ste_2', weight: 0.82, interactionType: 'purchase', count: 8 },
      { source: 'cat_medical', target: 'ste_3', weight: 0.75, interactionType: 'purchase', count: 3 },
    ],
    summary: {
      topCategories: [
        { name: 'Медицинское оборудование', weight: 0.85, count: 28 },
        { name: 'Расходные материалы', weight: 0.72, count: 45 },
        { name: 'Медикаменты', weight: 0.65, count: 12 }
      ],
      topBrands: [
        { name: 'МедТех', weight: 0.78, count: 15 },
        { name: 'ЗдравМед', weight: 0.62, count: 20 }
      ],
      topCharacteristics: [
        { name: 'Стерильность', weight: 0.9 },
        { name: 'Сертификация', weight: 0.85 },
        { name: 'Гарантия 2+ года', weight: 0.7 }
      ],
      totalInteractions: 85,
      personalizationStrength: 0.82
    }
  },
  '7728662669': {
    nodes: [
      { id: 'user', type: 'user', label: 'ГБОУ "Школа №1234"', weight: 1 },
      { id: 'cat_office', type: 'category', label: 'Канцелярские товары', weight: 0.88 },
      { id: 'cat_furniture', type: 'category', label: 'Мебель', weight: 0.65 },
      { id: 'cat_equipment', type: 'category', label: 'Учебное оборудование', weight: 0.72 },
      { id: 'brand_komus', type: 'brand', label: 'Комус', weight: 0.82 },
      { id: 'brand_attache', type: 'brand', label: 'Attache', weight: 0.68 },
      { id: 'char_bulk', type: 'characteristic', label: 'Оптовая упаковка', weight: 0.85 },
      { id: 'char_safety', type: 'characteristic', label: 'Безопасность для детей', weight: 0.9 },
      { id: 'char_eco', type: 'characteristic', label: 'Экологичность', weight: 0.6 },
      { id: 'ste_paper', type: 'ste', label: 'Бумага А4 для принтера', weight: 0.92 },
      { id: 'ste_pens', type: 'ste', label: 'Ручки шариковые синие', weight: 0.85 },
      { id: 'ste_folders', type: 'ste', label: 'Папки-скоросшиватели', weight: 0.78 },
    ],
    edges: [
      { source: 'user', target: 'cat_office', weight: 0.88, interactionType: 'purchase', count: 52 },
      { source: 'user', target: 'cat_furniture', weight: 0.65, interactionType: 'purchase', count: 8 },
      { source: 'user', target: 'cat_equipment', weight: 0.72, interactionType: 'purchase', count: 15 },
      { source: 'cat_office', target: 'brand_komus', weight: 0.82, interactionType: 'purchase', count: 35 },
      { source: 'cat_office', target: 'brand_attache', weight: 0.68, interactionType: 'purchase', count: 12 },
      { source: 'cat_office', target: 'char_bulk', weight: 0.85, interactionType: 'click', count: 45 },
      { source: 'cat_equipment', target: 'char_safety', weight: 0.9, interactionType: 'view', count: 28 },
      { source: 'brand_komus', target: 'char_eco', weight: 0.6, interactionType: 'view', count: 10 },
      { source: 'cat_office', target: 'ste_paper', weight: 0.92, interactionType: 'purchase', count: 24 },
      { source: 'cat_office', target: 'ste_pens', weight: 0.85, interactionType: 'purchase', count: 18 },
      { source: 'cat_office', target: 'ste_folders', weight: 0.78, interactionType: 'purchase', count: 10 },
    ],
    summary: {
      topCategories: [
        { name: 'Канцелярские товары', weight: 0.88, count: 52 },
        { name: 'Учебное оборудование', weight: 0.72, count: 15 },
        { name: 'Мебель', weight: 0.65, count: 8 }
      ],
      topBrands: [
        { name: 'Комус', weight: 0.82, count: 35 },
        { name: 'Attache', weight: 0.68, count: 12 }
      ],
      topCharacteristics: [
        { name: 'Безопасность для детей', weight: 0.9 },
        { name: 'Оптовая упаковка', weight: 0.85 },
        { name: 'Экологичность', weight: 0.6 }
      ],
      totalInteractions: 75,
      personalizationStrength: 0.78
    }
  },
  '7701234567': {
    nodes: [
      { id: 'user', type: 'user', label: 'ГКУ "Дирекция по строительству"', weight: 1 },
      { id: 'cat_building', type: 'category', label: 'Строительные материалы', weight: 0.9 },
      { id: 'cat_tools', type: 'category', label: 'Инструменты', weight: 0.78 },
      { id: 'cat_safety', type: 'category', label: 'Спецодежда', weight: 0.65 },
      { id: 'brand_techno', type: 'brand', label: 'ТехноСтрой', weight: 0.85 },
      { id: 'brand_makita', type: 'brand', label: 'Makita', weight: 0.72 },
      { id: 'char_gost', type: 'characteristic', label: 'ГОСТ соответствие', weight: 0.95 },
      { id: 'char_durability', type: 'characteristic', label: 'Долговечность', weight: 0.88 },
      { id: 'char_bulk', type: 'characteristic', label: 'Крупные партии', weight: 0.82 },
      { id: 'ste_cement', type: 'ste', label: 'Цемент М500', weight: 0.9 },
      { id: 'ste_brick', type: 'ste', label: 'Кирпич строительный', weight: 0.85 },
      { id: 'ste_drill', type: 'ste', label: 'Перфоратор профессиональный', weight: 0.75 },
    ],
    edges: [
      { source: 'user', target: 'cat_building', weight: 0.9, interactionType: 'purchase', count: 45 },
      { source: 'user', target: 'cat_tools', weight: 0.78, interactionType: 'purchase', count: 22 },
      { source: 'user', target: 'cat_safety', weight: 0.65, interactionType: 'purchase', count: 12 },
      { source: 'cat_building', target: 'brand_techno', weight: 0.85, interactionType: 'purchase', count: 30 },
      { source: 'cat_tools', target: 'brand_makita', weight: 0.72, interactionType: 'purchase', count: 15 },
      { source: 'cat_building', target: 'char_gost', weight: 0.95, interactionType: 'click', count: 65 },
      { source: 'cat_building', target: 'char_durability', weight: 0.88, interactionType: 'view', count: 40 },
      { source: 'brand_techno', target: 'char_bulk', weight: 0.82, interactionType: 'view', count: 25 },
      { source: 'cat_building', target: 'ste_cement', weight: 0.9, interactionType: 'purchase', count: 18 },
      { source: 'cat_building', target: 'ste_brick', weight: 0.85, interactionType: 'purchase', count: 12 },
      { source: 'cat_tools', target: 'ste_drill', weight: 0.75, interactionType: 'purchase', count: 5 },
    ],
    summary: {
      topCategories: [
        { name: 'Строительные материалы', weight: 0.9, count: 45 },
        { name: 'Инструменты', weight: 0.78, count: 22 },
        { name: 'Спецодежда', weight: 0.65, count: 12 }
      ],
      topBrands: [
        { name: 'ТехноСтрой', weight: 0.85, count: 30 },
        { name: 'Makita', weight: 0.72, count: 15 }
      ],
      topCharacteristics: [
        { name: 'ГОСТ соответствие', weight: 0.95 },
        { name: 'Долговечность', weight: 0.88 },
        { name: 'Крупные партии', weight: 0.82 }
      ],
      totalInteractions: 79,
      personalizationStrength: 0.85
    }
  }
}

// GET - получить граф предпочтений пользователя
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const inn = searchParams.get('inn')

  if (!inn) {
    return NextResponse.json({ error: 'inn required' }, { status: 400 })
  }

  if (isDatabaseConfigured()) {
    try {
      // Получаем данные о контрактах для построения графа
      const contractsResult = await query<{
        category: string
        ste_name: string
        ste_id: number
        contract_count: string
        total_amount: string
      }>(`
        SELECT 
          s.category,
          s.name as ste_name,
          s.ste_id,
          COUNT(c.contract_id) as contract_count,
          SUM(c.contract_amount) as total_amount
        FROM contracts c
        JOIN ste s ON c.ste_id = s.ste_id
        WHERE c.inn_buyer = $1
        GROUP BY s.category, s.name, s.ste_id
        ORDER BY contract_count DESC
      `, [inn])

      if (contractsResult && contractsResult.rows.length > 0) {
        const graph = buildGraphFromContracts(inn, contractsResult.rows)
        return NextResponse.json({ graph, source: 'database' })
      }
    } catch (error) {
      console.error('[API] Preferences query error:', error)
    }
  }

  // Fallback to demo data
  const graph = demoPreferences[inn] || generateDefaultGraph(inn)
  
  return NextResponse.json({
    graph,
    source: 'fallback'
  })
}

function buildGraphFromContracts(
  inn: string,
  contracts: Array<{
    category: string
    ste_name: string
    ste_id: number
    contract_count: string
    total_amount: string
  }>
): PreferenceGraph {
  const nodes: PreferenceNode[] = [
    { id: 'user', type: 'user', label: `ИНН ${inn}`, weight: 1 }
  ]
  const edges: PreferenceEdge[] = []
  
  // Агрегация по категориям
  const categoryStats: Record<string, { count: number; amount: number }> = {}
  const maxCount = Math.max(...contracts.map(c => parseInt(c.contract_count)))
  
  for (const contract of contracts) {
    const cat = contract.category
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, amount: 0 }
    }
    categoryStats[cat].count += parseInt(contract.contract_count)
    categoryStats[cat].amount += parseFloat(contract.total_amount)
    
    // Добавляем узлы СТЕ
    const steId = `ste_${contract.ste_id}`
    if (!nodes.find(n => n.id === steId)) {
      nodes.push({
        id: steId,
        type: 'ste',
        label: contract.ste_name,
        weight: parseInt(contract.contract_count) / maxCount
      })
    }
  }
  
  // Добавляем узлы категорий
  const maxCatCount = Math.max(...Object.values(categoryStats).map(s => s.count))
  for (const [category, stats] of Object.entries(categoryStats)) {
    const catId = `cat_${category.replace(/\s+/g, '_')}`
    nodes.push({
      id: catId,
      type: 'category',
      label: category,
      weight: stats.count / maxCatCount
    })
    
    edges.push({
      source: 'user',
      target: catId,
      weight: stats.count / maxCatCount,
      interactionType: 'purchase',
      count: stats.count
    })
    
    // Связи категория -> СТЕ
    for (const contract of contracts.filter(c => c.category === category)) {
      edges.push({
        source: catId,
        target: `ste_${contract.ste_id}`,
        weight: parseInt(contract.contract_count) / maxCount,
        interactionType: 'purchase',
        count: parseInt(contract.contract_count)
      })
    }
  }
  
  const topCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, stats]) => ({
      name,
      weight: stats.count / maxCatCount,
      count: stats.count
    }))
  
  return {
    nodes,
    edges,
    summary: {
      topCategories,
      topBrands: [],
      topCharacteristics: [],
      totalInteractions: contracts.reduce((sum, c) => sum + parseInt(c.contract_count), 0),
      personalizationStrength: Math.min(topCategories.length / 5, 1)
    }
  }
}

function generateDefaultGraph(inn: string): PreferenceGraph {
  return {
    nodes: [
      { id: 'user', type: 'user', label: `Организация ИНН ${inn}`, weight: 1 },
      { id: 'cat_default', type: 'category', label: 'Общие товары', weight: 0.5 }
    ],
    edges: [
      { source: 'user', target: 'cat_default', weight: 0.5, interactionType: 'view', count: 1 }
    ],
    summary: {
      topCategories: [{ name: 'Общие товары', weight: 0.5, count: 1 }],
      topBrands: [],
      topCharacteristics: [],
      totalInteractions: 1,
      personalizationStrength: 0.1
    }
  }
}
