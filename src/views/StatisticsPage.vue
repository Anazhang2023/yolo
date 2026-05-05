<template>
  <div class="statistics-container">
    <div class="statistics-header">
      <h1>📊 违规数据统计看板</h1>
      <p>点击下方按钮查看不同类型的数据图表</p>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>时间范围：</label>
        <select v-model="timeRange" @change="onFilterChange">
          <option value="week">近一周</option>
          <option value="month">近一月</option>
          <option value="quarter">近三月</option>
          <option value="year">近一年</option>
          <option value="all">全部</option>
        </select>
      </div>
      <div class="filter-group">
        <label>人员筛选：</label>
        <select v-model="selectedPerson" @change="onFilterChange">
          <option value="all">全部人员</option>
          <option v-for="person in personnelList" :key="person.pid" :value="person.pid">
            {{ person.pName }}
          </option>
        </select>
      </div>
      <button class="refresh-btn" @click="onFilterChange">🔄 刷新</button>
    </div>

    <!-- 统计卡片 - 数据概览 -->
    <div class="stats-cards-row">
      <div class="stat-card stat-card-blue">
        <div class="stat-icon">📋</div>
        <div class="stat-info">
          <div class="stat-value">{{ totalViolations }}</div>
          <div class="stat-label">总违规次数</div>
        </div>
      </div>
      <div class="stat-card stat-card-orange">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
      <div class="stat-card stat-card-green">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ processedCount }}</div>
          <div class="stat-label">已处理</div>
        </div>
      </div>
      <div class="stat-card stat-card-purple">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ involvedPersonnelCount }}</div>
          <div class="stat-label">涉及人员</div>
        </div>
      </div>
    </div>

    <!-- 图表切换按钮 -->
    <div class="chart-tabs">
      <button
          class="tab-btn"
          :class="{ active: activeChart === 'line' }"
          @click="switchChart('line')">
        📈 折线图
      </button>
      <button
          class="tab-btn"
          :class="{ active: activeChart === 'pie' }"
          @click="switchChart('pie')">
        🥧 饼图
      </button>
      <button
          class="tab-btn"
          :class="{ active: activeChart === 'doughnut' }"
          @click="switchChart('doughnut')">
        ⭕ 环形图
      </button>
      <button
          class="tab-btn"
          :class="{ active: activeChart === 'multiLine' }"
          @click="switchChart('multiLine')">
        📈 三线趋势图
      </button>
    </div>

    <!-- 图表展示区域 -->
    <div class="chart-center" v-if="hasChartData">
      <!-- 折线图 -->
      <div v-show="activeChart === 'line'" class="chart-card">
        <div class="chart-header">
          <h3>📈 违规趋势</h3>
          <span class="chart-subtitle">按日期统计违规数量</span>
        </div>
        <div class="chart-body">
          <canvas ref="lineChartRef"></canvas>
        </div>
      </div>

      <!-- 饼图 -->
      <div v-show="activeChart === 'pie'" class="chart-card">
        <div class="chart-header">
          <h3>🥧 违规类型分布</h3>
          <span class="chart-subtitle">各类型违规占比</span>
        </div>
        <div class="chart-body">
          <canvas ref="pieChartRef"></canvas>
        </div>
      </div>

      <!-- 环形图 -->
      <div v-show="activeChart === 'doughnut'" class="chart-card">
        <div class="chart-header">
          <h3>⭕ 处理状态占比</h3>
          <span class="chart-subtitle">待处理 vs 已处理</span>
        </div>
        <div class="chart-body">
          <canvas ref="doughnutChartRef"></canvas>
        </div>
      </div>

      <!-- 三线趋势图 -->
      <div v-show="activeChart === 'multiLine'" class="chart-card">
        <div class="chart-header">
          <h3>📈 主要违规类型趋势对比</h3>
          <span class="chart-subtitle">未佩戴安全帽、未佩戴口罩、未穿反光衣趋势</span>
        </div>
        <div class="chart-body chart-body-wide">
          <canvas ref="multiLineChartRef"></canvas>
        </div>
      </div>
    </div>

    <!-- 未点击任何按钮时的提示 -->
    <div class="chart-placeholder" v-else>
      <div class="placeholder-icon">📊</div>
      <p class="placeholder-text">请点击上方按钮查看图表</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { recordPageService } from '@/api/record'
import { personnelPageService } from '@/api/personnel'

Chart.register(...registerables)

// 数据
const allRecords = ref([])
const personnelList = ref([])
const timeRange = ref('month')
const selectedPerson = ref('all')

// 统计数据
const totalViolations = ref(0)
const pendingCount = ref(0)
const processedCount = ref(0)
const involvedPersonnelCount = ref(0)

// 当前激活的图表类型
const activeChart = ref(null)
const hasChartData = ref(false)

// 图表实例
let lineChart = null
let pieChart = null
let doughnutChart = null
let multiLineChart = null

// 图表ref
const lineChartRef = ref(null)
const pieChartRef = ref(null)
const doughnutChartRef = ref(null)
const multiLineChartRef = ref(null)

// 获取人员列表
const fetchPersonnel = async () => {
  try {
    const res = await personnelPageService({ pageNum: 1, pageSize: 999 })
    if (res?.code === 200) {
      personnelList.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取人员列表失败:', error)
  }
}

// 过滤数据（根据人员）
const filterRecords = () => {
  let records = [...allRecords.value]

  // 按人员筛选
  if (selectedPerson.value !== 'all') {
    records = records.filter(r => r.pid === selectedPerson.value)
  }

  return records
}

// 获取时间范围过滤后的数据
const getRecordsByTimeRange = () => {
  const records = filterRecords()
  let startDate

  switch (timeRange.value) {
    case 'week':
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'month':
      startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)
      break
    case 'quarter':
      startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 3)
      break
    case 'year':
      startDate = new Date()
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
    default:
      return records
  }

  return records.filter(r => new Date(r.createdAt) >= startDate)
}

// 格式化日期为 YYYY-MM-DD 格式（保证排序正确）
const formatDate = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 准备折线图数据（修复时间排序）
const prepareLineData = () => {
  const records = getRecordsByTimeRange()
  const dateMap = new Map()

  records.forEach(record => {
    const date = formatDate(record.createdAt)
    dateMap.set(date, (dateMap.get(date) || 0) + 1)
  })

  // 按日期排序（字符串 YYYY-MM-DD 格式可以直接比较）
  const sortedDates = Array.from(dateMap.keys()).sort((a, b) => a.localeCompare(b))
  const data = sortedDates.map(date => dateMap.get(date))

  return { labels: sortedDates, data }
}

// 准备饼图数据
const preparePieData = () => {
  const records = filterRecords()
  const typeMap = new Map()
  const typeNames = {
    1: '未佩戴安全帽',
    2: '未佩戴口罩',
    3: '未穿反光衣',
    4: '违规操作',
    5: '违规吸烟',
    6: '违规使用手机'
  }

  records.forEach(record => {
    const typeName = typeNames[record.vid] || `类型${record.vid}`
    typeMap.set(typeName, (typeMap.get(typeName) || 0) + 1)
  })

  const labels = Array.from(typeMap.keys())
  const data = Array.from(typeMap.values())
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']

  return { labels, data, colors }
}

// 准备环形图数据
const prepareDoughnutData = () => {
  const records = filterRecords()
  const pending = records.filter(r => r.status === 0).length
  const processed = records.filter(r => r.status === 1).length

  return {
    labels: ['待处理', '已处理'],
    data: [pending, processed],
    colors: ['#F39C12', '#27AE60']
  }
}

// 准备三线趋势图数据（修复时间排序）
const prepareMultiLineData = () => {
  const records = getRecordsByTimeRange()

  // 获取所有日期并排序
  const dateSet = new Set()
  records.forEach(record => {
    dateSet.add(formatDate(record.createdAt))
  })
  const dates = Array.from(dateSet).sort((a, b) => a.localeCompare(b))

  // 三条线的数据：未佩戴安全帽(1)、未佩戴口罩(2)、未穿反光衣(3)
  const safetyHelmetData = dates.map(date =>
      records.filter(r => formatDate(r.createdAt) === date && r.vid === 1).length
  )
  const maskData = dates.map(date =>
      records.filter(r => formatDate(r.createdAt) === date && r.vid === 2).length
  )
  const vestData = dates.map(date =>
      records.filter(r => formatDate(r.createdAt) === date && r.vid === 3).length
  )

  const datasets = [
    {
      label: '未佩戴安全帽',
      data: safetyHelmetData,
      borderColor: '#FF6384',
      backgroundColor: 'rgba(255, 99, 132, 0.1)',
      tension: 0.4,
      fill: false,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5
    },
    {
      label: '未佩戴口罩',
      data: maskData,
      borderColor: '#36A2EB',
      backgroundColor: 'rgba(54, 162, 235, 0.1)',
      tension: 0.4,
      fill: false,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5
    },
    {
      label: '未穿反光衣',
      data: vestData,
      borderColor: '#FFCE56',
      backgroundColor: 'rgba(255, 206, 86, 0.1)',
      tension: 0.4,
      fill: false,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5
    }
  ]

  return { labels: dates, datasets }
}

// 切换图表
const switchChart = async (type) => {
  activeChart.value = type
  hasChartData.value = true
  await nextTick()
  refreshCurrentChart()
}

// 刷新当前图表
const refreshCurrentChart = () => {
  switch (activeChart.value) {
    case 'line': updateLineChart(); break
    case 'pie': updatePieChart(); break
    case 'doughnut': updateDoughnutChart(); break
    case 'multiLine': updateMultiLineChart(); break
  }
}

// 筛选条件变化时，重新刷新当前显示的图表
const onFilterChange = async () => {
  await loadBaseData()
  if (hasChartData.value && activeChart.value) {
    await nextTick()
    refreshCurrentChart()
  }
}

// 更新折线图
const updateLineChart = () => {
  if (lineChart) lineChart.destroy()
  const { labels, data } = prepareLineData()
  if (labels.length === 0 || !lineChartRef.value) return

  lineChart = new Chart(lineChartRef.value, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '违规数量',
        data: data,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        tooltip: { mode: 'index', intersect: false }
      }
    }
  })
}

// 更新饼图
const updatePieChart = () => {
  if (pieChart) pieChart.destroy()
  const { labels, data, colors } = preparePieData()
  if (labels.length === 0 || !pieChartRef.value) return

  pieChart = new Chart(pieChartRef.value, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'right' },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}次 (${((ctx.raw / data.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)` } }
      }
    }
  })
}

// 更新环形图
const updateDoughnutChart = () => {
  if (doughnutChart) doughnutChart.destroy()
  const { labels, data, colors } = prepareDoughnutData()
  if (data.every(v => v === 0) || !doughnutChartRef.value) return

  doughnutChart = new Chart(doughnutChartRef.value, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 0,
        cutout: '60%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}次 (${((ctx.raw / data.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)` } }
      }
    }
  })
}

// 更新三线趋势图
const updateMultiLineChart = () => {
  if (multiLineChart) multiLineChart.destroy()
  const { labels, datasets } = prepareMultiLineData()
  if (labels.length === 0 || !multiLineChartRef.value) return

  multiLineChart = new Chart(multiLineChartRef.value, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12, weight: 'bold' } } },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '违规次数' } },
        x: { title: { display: true, text: '日期' } }
      }
    }
  })
}

// 加载基础统计数据
const loadBaseData = async () => {
  try {
    const res = await recordPageService({ pageNum: 1, pageSize: 99999 })
    if (res?.code === 200) {
      allRecords.value = res.data.data || []

      totalViolations.value = allRecords.value.length
      pendingCount.value = allRecords.value.filter(r => r.status === 0).length
      processedCount.value = allRecords.value.filter(r => r.status === 1).length
      const uniquePersonnel = new Set(allRecords.value.map(r => r.pid))
      involvedPersonnelCount.value = uniquePersonnel.size
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

// 清理图表
const destroyCharts = () => {
  const charts = [lineChart, pieChart, doughnutChart, multiLineChart]
  charts.forEach(chart => { if (chart) chart.destroy() })
}

onMounted(async () => {
  await fetchPersonnel()
  await loadBaseData()
})

onUnmounted(() => {
  destroyCharts()
})
</script>

<style scoped>
.statistics-container {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 24px;
  overflow-y: auto;
}

.statistics-header {
  text-align: center;
  margin-bottom: 24px;
}

.statistics-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.statistics-header p {
  color: #666;
  font-size: 14px;
}

/* 筛选栏 */
.filter-bar {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: #555;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  outline: none;
}

.filter-group select:focus {
  border-color: #667eea;
}

.refresh-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.refresh-btn:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

/* 统计卡片 */
.stats-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card-blue { border-left: 4px solid #667eea; }
.stat-card-orange { border-left: 4px solid #f39c12; }
.stat-card-green { border-left: 4px solid #27ae60; }
.stat-card-purple { border-left: 4px solid #9b59b6; }

.stat-icon {
  font-size: 42px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

/* 图表切换按钮 */
.chart-tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 30px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  color: #666;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 图表展示区域 */
.chart-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
}

.chart-card {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chart-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.chart-header h3 {
  font-size: 22px;
  color: #333;
  margin-bottom: 8px;
}

.chart-subtitle {
  font-size: 14px;
  color: #999;
}

.chart-body {
  height: 450px;
  position: relative;
}

.chart-body-wide {
  height: 500px;
}

/* 未点击时的占位符 */
.chart-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: white;
  border-radius: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 18px;
  color: #999;
}

/* 响应式 */
@media (max-width: 1000px) {
  .stats-cards-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-body {
    height: 380px;
  }
}

@media (max-width: 768px) {
  .statistics-container {
    padding: 16px;
  }
  .stats-cards-row {
    grid-template-columns: 1fr;
  }
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-group {
    justify-content: space-between;
  }
  .filter-group select {
    flex: 1;
  }
  .chart-tabs {
    gap: 8px;
  }
  .tab-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
  .chart-body {
    height: 280px;
  }
  .chart-header h3 {
    font-size: 18px;
  }
  .placeholder-icon {
    font-size: 60px;
  }
  .placeholder-text {
    font-size: 16px;
  }
}
</style>