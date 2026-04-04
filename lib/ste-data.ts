export interface STEItem {
  id: string
  steCode: string
  name: string
  description: string
  category: string
  okpdCode: string
  characteristics: Record<string, string>
  unit: string
  priceMin: number
  priceMax: number
  relevanceScore?: number
  personalizedScore?: number
  purchaseCount?: number
}

// Synonyms dictionary
export const synonyms: Record<string, string[]> = {
  'канцелярия': ['офисные принадлежности', 'канцтовары', 'письменные принадлежности'],
  'тетрадь': ['тетради', 'блокноты', 'записные книжки'],
  'ручка': ['ручки', 'письменные принадлежности', 'шариковые ручки'],
  'бумага': ['бумага офисная', 'листы', 'бумажная продукция'],
  'стол': ['столы', 'рабочее место', 'мебель офисная'],
  'стул': ['стулья', 'кресла', 'офисные кресла'],
  'компьютер': ['пк', 'эвм', 'компьютерная техника', 'системный блок'],
  'монитор': ['дисплей', 'экран', 'монитор компьютерный'],
  'принтер': ['мфу', 'печатающее устройство', 'принтеры'],
  'шприц': ['шприцы', 'шприц медицинский', 'инъекционные'],
  'бинт': ['бинты', 'перевязочный материал', 'марля'],
  'цемент': ['цементы', 'вяжущие материалы', 'стройматериалы'],
  'кирпич': ['кирпичи', 'строительный кирпич', 'керамический'],
  'краска': ['краски', 'лакокрасочные', 'эмаль'],
}

// Generate mock STE data
export const steItems: STEItem[] = [
  // Канцелярия (Office supplies)
  { id: '1', steCode: 'СТЕ-001', name: 'Бумага офисная А4', description: 'Бумага для офисной техники формата А4, плотность 80 г/м², белизна 146% CIE', category: 'Канцелярия', okpdCode: '17.12.14.110', characteristics: { 'Формат': 'А4', 'Плотность': '80 г/м²', 'Листов в пачке': '500' }, unit: 'пачка', priceMin: 350, priceMax: 450, purchaseCount: 1250 },
  { id: '2', steCode: 'СТЕ-002', name: 'Ручка шариковая синяя', description: 'Ручка шариковая с чернилами синего цвета, толщина линии 0.5 мм', category: 'Канцелярия', okpdCode: '32.99.12.120', characteristics: { 'Цвет чернил': 'синий', 'Толщина линии': '0.5 мм' }, unit: 'шт', priceMin: 15, priceMax: 35, purchaseCount: 890 },
  { id: '3', steCode: 'СТЕ-003', name: 'Тетрадь общая 96 листов', description: 'Тетрадь общая в клетку, 96 листов, обложка мелованный картон', category: 'Канцелярия', okpdCode: '17.23.13.110', characteristics: { 'Количество листов': '96', 'Линовка': 'клетка' }, unit: 'шт', priceMin: 45, priceMax: 85, purchaseCount: 650 },
  { id: '4', steCode: 'СТЕ-004', name: 'Папка-регистратор', description: 'Папка-регистратор с арочным механизмом, корешок 70 мм', category: 'Канцелярия', okpdCode: '22.29.26.110', characteristics: { 'Ширина корешка': '70 мм', 'Формат': 'А4' }, unit: 'шт', priceMin: 120, priceMax: 200, purchaseCount: 520 },
  { id: '5', steCode: 'СТЕ-005', name: 'Степлер настольный', description: 'Степлер настольный, глубина захвата 50 мм, на 25 листов', category: 'Канцелярия', okpdCode: '28.99.39.110', characteristics: { 'Глубина захвата': '50 мм', 'Мощность': '25 листов' }, unit: 'шт', priceMin: 180, priceMax: 350, purchaseCount: 340 },
  { id: '6', steCode: 'СТЕ-006', name: 'Скрепки канцелярские', description: 'Скрепки металлические 28 мм, никелированные', category: 'Канцелярия', okpdCode: '25.99.29.110', characteristics: { 'Размер': '28 мм', 'Покрытие': 'никель' }, unit: 'упаковка', priceMin: 25, priceMax: 50, purchaseCount: 780 },
  { id: '7', steCode: 'СТЕ-007', name: 'Карандаш чернографитный', description: 'Карандаш чернографитный HB с ластиком', category: 'Канцелярия', okpdCode: '32.99.12.110', characteristics: { 'Твёрдость': 'HB', 'С ластиком': 'да' }, unit: 'шт', priceMin: 10, priceMax: 25, purchaseCount: 920 },
  { id: '8', steCode: 'СТЕ-008', name: 'Маркер перманентный', description: 'Маркер перманентный чёрный, пулевидный наконечник', category: 'Канцелярия', okpdCode: '32.99.12.130', characteristics: { 'Цвет': 'чёрный', 'Тип наконечника': 'пулевидный' }, unit: 'шт', priceMin: 35, priceMax: 70, purchaseCount: 450 },
  { id: '9', steCode: 'СТЕ-009', name: 'Корректор-лента', description: 'Корректирующая лента 5 мм × 8 м', category: 'Канцелярия', okpdCode: '32.99.12.140', characteristics: { 'Ширина ленты': '5 мм', 'Длина ленты': '8 м' }, unit: 'шт', priceMin: 55, priceMax: 95, purchaseCount: 380 },
  { id: '10', steCode: 'СТЕ-010', name: 'Ножницы офисные', description: 'Ножницы офисные 21 см, нержавеющая сталь', category: 'Канцелярия', okpdCode: '25.71.15.110', characteristics: { 'Длина': '21 см', 'Материал': 'нержавеющая сталь' }, unit: 'шт', priceMin: 85, priceMax: 150, purchaseCount: 290 },
  
  // Мебель (Furniture)
  { id: '11', steCode: 'СТЕ-011', name: 'Стол письменный офисный', description: 'Стол письменный офисный 1400×700×750 мм, ЛДСП', category: 'Мебель', okpdCode: '31.01.12.110', characteristics: { 'Размеры': '1400×700×750 мм', 'Материал': 'ЛДСП' }, unit: 'шт', priceMin: 4500, priceMax: 8500, purchaseCount: 180 },
  { id: '12', steCode: 'СТЕ-012', name: 'Кресло офисное', description: 'Кресло офисное на колёсиках, с подлокотниками', category: 'Мебель', okpdCode: '31.01.12.120', characteristics: { 'Тип': 'операторское', 'Подлокотники': 'да' }, unit: 'шт', priceMin: 5500, priceMax: 12000, purchaseCount: 210 },
  { id: '13', steCode: 'СТЕ-013', name: 'Шкаф для документов', description: 'Шкаф для документов с замком, 4 полки', category: 'Мебель', okpdCode: '31.01.12.130', characteristics: { 'Количество полок': '4', 'Замок': 'да' }, unit: 'шт', priceMin: 8500, priceMax: 15000, purchaseCount: 95 },
  { id: '14', steCode: 'СТЕ-014', name: 'Тумба подкатная', description: 'Тумба подкатная с 3 ящиками, с замком', category: 'Мебель', okpdCode: '31.01.12.140', characteristics: { 'Количество ящиков': '3', 'Замок': 'да' }, unit: 'шт', priceMin: 3500, priceMax: 6500, purchaseCount: 145 },
  { id: '15', steCode: 'СТЕ-015', name: 'Стул посетительский', description: 'Стул на металлокаркасе для посетителей', category: 'Мебель', okpdCode: '31.01.12.150', characteristics: { 'Каркас': 'металлический', 'Обивка': 'ткань' }, unit: 'шт', priceMin: 1800, priceMax: 3500, purchaseCount: 320 },
  
  // Компьютерная техника (IT Equipment)
  { id: '16', steCode: 'СТЕ-016', name: 'Монитор 24 дюйма', description: 'Монитор ЖК 24 дюйма, Full HD, IPS матрица', category: 'Компьютерная техника', okpdCode: '26.20.11.110', characteristics: { 'Диагональ': '24 дюйма', 'Разрешение': 'Full HD', 'Матрица': 'IPS' }, unit: 'шт', priceMin: 12000, priceMax: 22000, purchaseCount: 165 },
  { id: '17', steCode: 'СТЕ-017', name: 'Системный блок офисный', description: 'Системный блок для офисных задач, Intel Core i5, 8GB RAM, SSD 256GB', category: 'Компьютерная техника', okpdCode: '26.20.11.120', characteristics: { 'Процессор': 'Intel Core i5', 'ОЗУ': '8 GB', 'SSD': '256 GB' }, unit: 'шт', priceMin: 35000, priceMax: 55000, purchaseCount: 120 },
  { id: '18', steCode: 'СТЕ-018', name: 'Принтер лазерный', description: 'Принтер лазерный чёрно-белый, А4, 30 стр/мин', category: 'Компьютерная техника', okpdCode: '26.20.18.110', characteristics: { 'Тип печати': 'лазерная', 'Скорость': '30 стр/мин', 'Формат': 'А4' }, unit: 'шт', priceMin: 15000, priceMax: 28000, purchaseCount: 95 },
  { id: '19', steCode: 'СТЕ-019', name: 'МФУ лазерное', description: 'МФУ лазерное (принтер/сканер/копир), А4', category: 'Компьютерная техника', okpdCode: '26.20.18.120', characteristics: { 'Функции': 'печать/сканирование/копирование', 'Тип': 'лазерное' }, unit: 'шт', priceMin: 25000, priceMax: 45000, purchaseCount: 78 },
  { id: '20', steCode: 'СТЕ-020', name: 'Клавиатура USB', description: 'Клавиатура проводная USB, русская раскладка', category: 'Компьютерная техника', okpdCode: '26.20.15.110', characteristics: { 'Подключение': 'USB', 'Раскладка': 'русская' }, unit: 'шт', priceMin: 450, priceMax: 1200, purchaseCount: 380 },
  { id: '21', steCode: 'СТЕ-021', name: 'Мышь компьютерная', description: 'Мышь оптическая проводная USB', category: 'Компьютерная техника', okpdCode: '26.20.15.120', characteristics: { 'Тип': 'оптическая', 'Подключение': 'USB' }, unit: 'шт', priceMin: 250, priceMax: 800, purchaseCount: 420 },
  { id: '22', steCode: 'СТЕ-022', name: 'Картридж для принтера', description: 'Картридж для лазерного принтера HP', category: 'Компьютерная техника', okpdCode: '26.20.18.130', characteristics: { 'Совместимость': 'HP LaserJet', 'Ресурс': '2000 страниц' }, unit: 'шт', priceMin: 2500, priceMax: 5500, purchaseCount: 280 },
  
  // Медицинское оборудование (Medical Equipment)
  { id: '23', steCode: 'СТЕ-023', name: 'Шприц одноразовый 5 мл', description: 'Шприц инъекционный одноразовый 5 мл с иглой', category: 'Медицинское оборудование', okpdCode: '32.50.13.110', characteristics: { 'Объём': '5 мл', 'Игла': 'в комплекте' }, unit: 'шт', priceMin: 5, priceMax: 15, purchaseCount: 2500 },
  { id: '24', steCode: 'СТЕ-024', name: 'Бинт марлевый', description: 'Бинт марлевый медицинский нестерильный 7м×14см', category: 'Медицинское оборудование', okpdCode: '32.50.13.120', characteristics: { 'Длина': '7 м', 'Ширина': '14 см' }, unit: 'шт', priceMin: 15, priceMax: 35, purchaseCount: 1800 },
  { id: '25', steCode: 'СТЕ-025', name: 'Вата медицинская', description: 'Вата медицинская гигроскопическая 100 г', category: 'Медицинское оборудование', okpdCode: '32.50.13.130', characteristics: { 'Масса': '100 г', 'Тип': 'гигроскопическая' }, unit: 'упаковка', priceMin: 35, priceMax: 65, purchaseCount: 1200 },
  { id: '26', steCode: 'СТЕ-026', name: 'Перчатки медицинские', description: 'Перчатки латексные смотровые нестерильные, размер M', category: 'Медицинское оборудование', okpdCode: '32.50.13.140', characteristics: { 'Материал': 'латекс', 'Размер': 'M' }, unit: 'пара', priceMin: 8, priceMax: 20, purchaseCount: 3200 },
  { id: '27', steCode: 'СТЕ-027', name: 'Маска медицинская', description: 'Маска медицинская трёхслойная одноразовая', category: 'Медицинское оборудование', okpdCode: '32.50.13.150', characteristics: { 'Слоев': '3', 'Тип': 'одноразовая' }, unit: 'шт', priceMin: 3, priceMax: 10, purchaseCount: 5000 },
  { id: '28', steCode: 'СТЕ-028', name: 'Термометр электронный', description: 'Термометр медицинский электронный', category: 'Медицинское оборудование', okpdCode: '26.51.52.110', characteristics: { 'Тип': 'электронный', 'Точность': '±0.1°C' }, unit: 'шт', priceMin: 150, priceMax: 350, purchaseCount: 450 },
  { id: '29', steCode: 'СТЕ-029', name: 'Тонометр автоматический', description: 'Тонометр автоматический для измерения артериального давления', category: 'Медицинское оборудование', okpdCode: '26.51.52.120', characteristics: { 'Тип': 'автоматический', 'Манжета': 'универсальная' }, unit: 'шт', priceMin: 1500, priceMax: 4500, purchaseCount: 180 },
  { id: '30', steCode: 'СТЕ-030', name: 'Антисептик для рук', description: 'Антисептическое средство для обработки рук 500 мл', category: 'Медицинское оборудование', okpdCode: '20.20.14.110', characteristics: { 'Объём': '500 мл', 'Форма': 'гель' }, unit: 'шт', priceMin: 120, priceMax: 280, purchaseCount: 890 },
  { id: '31', steCode: 'СТЕ-031', name: 'Стетоскоп', description: 'Стетоскоп медицинский терапевтический', category: 'Медицинское оборудование', okpdCode: '32.50.21.110', characteristics: { 'Тип': 'терапевтический', 'Материал': 'нержавеющая сталь' }, unit: 'шт', priceMin: 800, priceMax: 2500, purchaseCount: 95 },
  { id: '32', steCode: 'СТЕ-032', name: 'Пульсоксиметр', description: 'Пульсоксиметр напальцевый для измерения SpO2', category: 'Медицинское оборудование', okpdCode: '26.51.52.130', characteristics: { 'Тип': 'напальцевый', 'Дисплей': 'OLED' }, unit: 'шт', priceMin: 1200, priceMax: 3500, purchaseCount: 220 },
  
  // Строительные материалы (Construction Materials)
  { id: '33', steCode: 'СТЕ-033', name: 'Цемент М500', description: 'Цемент портландцемент М500 мешок 50 кг', category: 'Строительные материалы', okpdCode: '23.51.11.110', characteristics: { 'Марка': 'М500', 'Масса': '50 кг' }, unit: 'мешок', priceMin: 350, priceMax: 550, purchaseCount: 850 },
  { id: '34', steCode: 'СТЕ-034', name: 'Кирпич керамический', description: 'Кирпич керамический рядовой полнотелый М150', category: 'Строительные материалы', okpdCode: '23.32.11.110', characteristics: { 'Марка': 'М150', 'Тип': 'полнотелый' }, unit: 'шт', priceMin: 12, priceMax: 25, purchaseCount: 15000 },
  { id: '35', steCode: 'СТЕ-035', name: 'Песок строительный', description: 'Песок строительный речной фракция 0.5-2 мм', category: 'Строительные материалы', okpdCode: '08.12.12.110', characteristics: { 'Фракция': '0.5-2 мм', 'Тип': 'речной' }, unit: 'м³', priceMin: 800, priceMax: 1500, purchaseCount: 450 },
  { id: '36', steCode: 'СТЕ-036', name: 'Щебень гранитный', description: 'Щебень гранитный фракция 5-20 мм', category: 'Строительные материалы', okpdCode: '08.11.11.110', characteristics: { 'Фракция': '5-20 мм', 'Материал': 'гранит' }, unit: 'м³', priceMin: 1200, priceMax: 2200, purchaseCount: 380 },
  { id: '37', steCode: 'СТЕ-037', name: 'Арматура А400', description: 'Арматура стальная А400 диаметр 12 мм', category: 'Строительные материалы', okpdCode: '24.10.71.110', characteristics: { 'Диаметр': '12 мм', 'Класс': 'А400' }, unit: 'тонна', priceMin: 45000, priceMax: 65000, purchaseCount: 85 },
  { id: '38', steCode: 'СТЕ-038', name: 'Краска фасадная', description: 'Краска фасадная акриловая белая 10 л', category: 'Строительные материалы', okpdCode: '20.30.11.110', characteristics: { 'Объём': '10 л', 'Цвет': 'белый', 'Тип': 'акриловая' }, unit: 'ведро', priceMin: 1500, priceMax: 3500, purchaseCount: 320 },
  { id: '39', steCode: 'СТЕ-039', name: 'Гипсокартон 12.5мм', description: 'Гипсокартон стеновой 2500×1200×12.5 мм', category: 'Строительные материалы', okpdCode: '23.62.10.110', characteristics: { 'Размеры': '2500×1200×12.5 мм', 'Тип': 'стеновой' }, unit: 'лист', priceMin: 350, priceMax: 550, purchaseCount: 680 },
  { id: '40', steCode: 'СТЕ-040', name: 'Утеплитель минвата', description: 'Утеплитель минеральная вата 1200×600×50 мм', category: 'Строительные материалы', okpdCode: '23.99.14.110', characteristics: { 'Размеры': '1200×600×50 мм', 'Плотность': '50 кг/м³' }, unit: 'упаковка', priceMin: 650, priceMax: 1100, purchaseCount: 420 },
  { id: '41', steCode: 'СТЕ-041', name: 'Профиль потолочный', description: 'Профиль потолочный ПП 60×27 мм, длина 3 м', category: 'Строительные материалы', okpdCode: '24.33.11.110', characteristics: { 'Размер': '60×27 мм', 'Длина': '3 м' }, unit: 'шт', priceMin: 120, priceMax: 220, purchaseCount: 560 },
  { id: '42', steCode: 'СТЕ-042', name: 'Саморезы по металлу', description: 'Саморезы по металлу 3.5×25 мм оцинкованные', category: 'Строительные материалы', okpdCode: '25.94.11.110', characteristics: { 'Размер': '3.5×25 мм', 'Покрытие': 'цинк' }, unit: 'упаковка', priceMin: 150, priceMax: 280, purchaseCount: 890 },
  
  // Дополнительные товары для разнообразия
  { id: '43', steCode: 'СТЕ-043', name: 'Блокнот А5', description: 'Блокнот на пружине А5, 80 листов, клетка', category: 'Канцелярия', okpdCode: '17.23.13.120', characteristics: { 'Формат': 'А5', 'Листов': '80' }, unit: 'шт', priceMin: 65, priceMax: 120, purchaseCount: 480 },
  { id: '44', steCode: 'СТЕ-044', name: 'Файл-вкладыш А4', description: 'Файл-вкладыш А4 прозрачный 30 мкм', category: 'Канцелярия', okpdCode: '22.29.26.120', characteristics: { 'Формат': 'А4', 'Плотность': '30 мкм' }, unit: 'упаковка', priceMin: 85, priceMax: 150, purchaseCount: 620 },
  { id: '45', steCode: 'СТЕ-045', name: 'Дырокол', description: 'Дырокол на 30 листов с линейкой', category: 'Канцелярия', okpdCode: '28.99.39.120', characteristics: { 'Мощность': '30 листов' }, unit: 'шт', priceMin: 280, priceMax: 450, purchaseCount: 190 },
  { id: '46', steCode: 'СТЕ-046', name: 'Клей-карандаш', description: 'Клей-карандаш 21 г для бумаги и картона', category: 'Канцелярия', okpdCode: '20.52.10.110', characteristics: { 'Масса': '21 г' }, unit: 'шт', priceMin: 35, priceMax: 70, purchaseCount: 540 },
  { id: '47', steCode: 'СТЕ-047', name: 'Ластик мягкий', description: 'Ластик мягкий белый для карандаша', category: 'Канцелярия', okpdCode: '22.19.71.110', characteristics: { 'Цвет': 'белый', 'Тип': 'мягкий' }, unit: 'шт', priceMin: 10, priceMax: 25, purchaseCount: 720 },
  { id: '48', steCode: 'СТЕ-048', name: 'Линейка 30 см', description: 'Линейка пластиковая прозрачная 30 см', category: 'Канцелярия', okpdCode: '32.99.59.110', characteristics: { 'Длина': '30 см', 'Материал': 'пластик' }, unit: 'шт', priceMin: 20, priceMax: 45, purchaseCount: 380 },
  { id: '49', steCode: 'СТЕ-049', name: 'Точилка настольная', description: 'Точилка для карандашей настольная механическая', category: 'Канцелярия', okpdCode: '28.99.39.130', characteristics: { 'Тип': 'механическая' }, unit: 'шт', priceMin: 350, priceMax: 650, purchaseCount: 120 },
  { id: '50', steCode: 'СТЕ-050', name: 'Флеш-накопитель 32GB', description: 'USB флеш-накопитель 32 ГБ USB 3.0', category: 'Компьютерная техника', okpdCode: '26.20.21.110', characteristics: { 'Объём': '32 ГБ', 'Интерфейс': 'USB 3.0' }, unit: 'шт', priceMin: 350, priceMax: 650, purchaseCount: 280 },
]

// Categories for filtering
export const categories = [
  'Все категории',
  'Канцелярия',
  'Мебель',
  'Компьютерная техника',
  'Медицинское оборудование',
  'Строительные материалы'
]

// Role-based recommendations
export const roleRecommendations: Record<string, string[]> = {
  office: ['1', '2', '3', '4', '5', '6', '7', '11', '12', '16', '17', '20', '21'],
  medical: ['23', '24', '25', '26', '27', '28', '29', '30', '31', '32'],
  construction: ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42']
}
