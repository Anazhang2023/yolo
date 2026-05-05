<template>
  <div class="violation-management">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <select class="filter-select" v-model="filters.status">
          <option value="">全部状态</option>
          <option value="0">待处理</option>
          <option value="1">已处理</option>
        </select>
        <input
            type="date"
            class="filter-input"
            v-model="filters.startDate"
            placeholder="开始日期"
        />
        <input
            type="date"
            class="filter-input"
            v-model="filters.endDate"
            placeholder="结束日期"
        />
        <button class="btn-header" @click="resetFilters">
          <span class="icon">🔄</span> 重置
        </button>
      </div>
      <div class="filter-right">
        <div class="search-box">
          <input
              type="text"
              placeholder="搜索人员/类型"
              v-model="filters.keyword"
              @keyup.enter="handleSearch"
          />
          <button class="search-btn" @click="handleSearch">🔍</button>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧表格区 -->
      <div class="table-section">
        <div class="section-header">
          <h3>违规记录</h3>
          <span class="total-count">共 {{ total }} 条记录</span>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 表格内容 -->
        <table v-else class="violation-table">
          <thead>
          <tr>
            <th>序号</th>
            <th>时间</th>
            <th>违规类型</th>
            <th>涉及人员</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(item, index) in currentPageData" :key="item.did">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ formatTime(item.createdAt) }}</td>
            <td>
              <span class="type-tag">{{ getViolationTypeName(item.vid) }}</span>
            </td>
            <td>
              {{ item.personnelName || '未知人员' }}
              <span style="color:#999;font-size:12px;">(ID:{{ item.pid }})</span>
            </td>
            <td>
              <span :class="`status-tag ${getStatusClass(item.status)}`">{{ getStatusText(item.status) }}</span>
            </td>
            <td class="actions">
              <button class="action-btn" title="查看详情" @click.stop="openDetailModal(item)">👁️</button>
              <button class="action-btn" title="修改记录" @click.stop="openEditModal(item)">✏️</button>
              <button class="action-btn" title="删除记录" @click.stop="confirmDelete(item)">🗑️</button>
            </td>
          </tr>
          <tr v-if="currentPageData.length === 0 && !loading">
            <td colspan="6" class="empty-data">暂无符合条件的违规记录</td>
          </tr>
          </tbody>
        </table>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="total > 0">
          <div class="pagination">
            <button class="page-btn" @click="changePage(1)" :disabled="currentPage === 1">«</button>
            <button class="page-btn" @click="changePage(currentPage - 1)" :disabled="currentPage === 1">‹</button>
            <button
                v-for="page in displayPages"
                :key="page"
                class="page-btn"
                :class="{ active: currentPage === page }"
                @click="changePage(page)"
            >
              {{ page }}
            </button>
            <span class="page-info">{{ currentPage }}/{{ totalPages }} 页</span>
            <button class="page-btn" @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">›</button>
            <button class="page-btn" @click="changePage(totalPages)" :disabled="currentPage === totalPages">»</button>
          </div>
        </div>
      </div>

      <!-- 右侧信息区 - 基于全部数据统计 -->
      <div class="sidebar">
        <div class="sidebar-card">
          <div class="card-title">
            <span class="icon">📊</span> 违规类型分布
            <span class="stat-badge">全部数据</span>
          </div>
          <div class="distribution-list">
            <div v-if="loadingStats" class="loading-small">
              <div class="loading-spinner-small"></div>
              <span>加载统计中...</span>
            </div>
            <div v-else>
              <div class="distribution-item" v-for="item in typeDistribution" :key="item.typeName">
                <div class="item-left">
                  <span :class="`color-dot ${item.color}`"></span>
                  <span>{{ item.typeName }}</span>
                </div>
                <div class="item-right">{{ item.count }}次 ({{ item.percentage }}%)</div>
              </div>
              <div v-if="typeDistribution.length === 0" class="empty-data">暂无分布数据</div>
            </div>
          </div>
        </div>

        <div class="sidebar-card" style="margin-top: 16px;">
          <div class="card-title">
            <span class="icon">📈</span> 状态统计
            <span class="stat-badge">全部数据</span>
          </div>
          <div class="distribution-list">
            <div v-if="loadingStats" class="loading-small">
              <div class="loading-spinner-small"></div>
              <span>加载统计中...</span>
            </div>
            <div v-else>
              <div class="distribution-item">
                <div class="item-left">
                  <span class="color-dot pending"></span>
                  <span>待处理</span>
                </div>
                <div class="item-right">{{ allPendingCount }}条 ({{ allPendingPercentage }}%)</div>
              </div>
              <div class="distribution-item">
                <div class="item-left">
                  <span class="color-dot processed"></span>
                  <span>已处理</span>
                </div>
                <div class="item-right">{{ allProcessedCount }}条 ({{ allProcessedPercentage }}%)</div>
              </div>
              <div class="distribution-total">
                <div class="item-left">
                  <strong>总计</strong>
                </div>
                <div class="item-right"><strong>{{ allTotalCount }}条</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div class="detail-modal" v-if="detailVisible" @click.self="closeDetailModal">
      <div class="detail-content" @click.stop>
        <div class="detail-header">
          <h2>违规记录详情 #{{ detailRecord.did }}</h2>
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>
        <div class="detail-body">
          <div class="info-grid">
            <div class="info-item">
              <label>违规类型：</label>
              <span class="type-tag">{{ getViolationTypeName(detailRecord.vid) }}</span>
            </div>
            <div class="info-item">
              <label>涉及人员：</label>
              <span>{{ detailRecord.personnelName || '未知人员' }} (ID:{{ detailRecord.pid }})</span>
            </div>
            <div class="info-item">
              <label>记录时间：</label>
              <span>{{ formatTime(detailRecord.createdAt) }}</span>
            </div>
            <div class="info-item">
              <label>当前状态：</label>
              <span :class="`status-tag ${getStatusClass(detailRecord.status)}`">
                {{ getStatusText(detailRecord.status) }}
              </span>
            </div>
          </div>
          <div class="image-preview-section">
            <h3>违规现场图片</h3>
            <div class="image-wrapper">
              <div v-if="detailRecord.imagePath && !imageError" class="image-container">
                <img
                    :src="getImageUrl(detailRecord.imagePath)"
                    alt="违规图片"
                    class="detail-image"
                    @error="handleImageError"
                />
              </div>
              <div v-else class="no-image">
                <span class="no-image-icon">🖼️</span>
                <p>{{ imageError ? '图片加载失败' : '暂无违规图片' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div class="edit-modal" v-if="editVisible" @click.self="closeEditModal">
      <div class="edit-content" @click.stop>
        <div class="edit-header">
          <h2>修改违规记录 #{{ editForm.did }}</h2>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>
        <div class="edit-body">
          <div class="form-item">
            <label>涉及人员</label>
            <select v-model.number="editForm.pid" class="form-input">
              <option value="">请选择人员</option>
              <option v-for="p in personnelList" :key="p.pid" :value="p.pid">
                {{ p.pName }} (ID:{{ p.pid }})
              </option>
            </select>
          </div>

          <div class="form-item">
            <label>处理状态</label>
            <select v-model="editForm.status" class="form-input">
              <option value="0">待处理</option>
              <option value="1">已处理</option>
            </select>
          </div>
        </div>
        <div class="edit-footer">
          <button class="btn-cancel" @click="closeEditModal">取消</button>
          <button class="btn-save" @click="submitEdit">保存修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'

import {
  recordPageService,
  recordDeleteService,
  recordUpdateService
} from '@/api/record'

import { typeGetAllService } from '@/api/type'

const allRawData = ref([])
const loading = ref(false)
const loadingStats = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(5)
const totalPages = ref(1)
const typeList = ref([])
const personnelList = ref([])

// 当前页显示的数据
const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allRawData.value.slice(start, end)
})

// 全部数据（用于统计）
const allRecordsForStats = ref([])

const filters = reactive({
  keyword: '',
  status: '',
  startDate: '',
  endDate: ''
})

// 类型分布（基于全部数据）
const typeDistribution = ref([])

// 状态统计（基于全部数据）
const allPendingCount = ref(0)
const allProcessedCount = ref(0)
const allTotalCount = ref(0)

// 百分比计算
const allPendingPercentage = computed(() => {
  if (allTotalCount.value === 0) return 0
  return ((allPendingCount.value / allTotalCount.value) * 100).toFixed(1)
})

const allProcessedPercentage = computed(() => {
  if (allTotalCount.value === 0) return 0
  return ((allProcessedCount.value / allTotalCount.value) * 100).toFixed(1)
})

const detailVisible = ref(false)
const detailRecord = ref({})
const imageError = ref(false)

const editVisible = ref(false)
const editForm = reactive({
  did: null,
  vid: null,
  pid: null,
  status: null
})

const loadTypeList = async () => {
  try {
    const res = await typeGetAllService()
    typeList.value = res.data || []
  } catch (e) {
    console.error('获取类型失败', e)
  }
}

const loadPersonnelList = async () => {
  try {
    const res = await fetch('/personnel/findAll')
    const data = await res.json()
    personnelList.value = data || []
  } catch (e) {
    console.error('加载人员失败', e)
  }
}

// 获取全部数据用于统计
const fetchAllRecordsForStats = async () => {
  loadingStats.value = true
  try {
    const params = {
      pageNum: 1,
      pageSize: 99999,
      keyword: filters.keyword.trim() || null,
      status: filters.status ? +filters.status : null,
      startDate: filters.startDate || null,
      endDate: filters.endDate || null
    }
    const res = await recordPageService(params)

    if (res?.code === 200) {
      allRecordsForStats.value = res.data.data || []
      allTotalCount.value = res.data.total || 0

      allPendingCount.value = allRecordsForStats.value.filter(i => i.status === 0).length
      allProcessedCount.value = allRecordsForStats.value.filter(i => i.status === 1).length

      calculateTypeDistributionFromAll()
    }
  } catch (e) {
    console.error('获取统计数据失败', e)
  } finally {
    loadingStats.value = false
  }
}

// 基于全部数据计算类型分布
const calculateTypeDistributionFromAll = () => {
  const colors = ['red', 'orange', 'green', 'blue', 'purple', 'gray']
  const map = new Map()

  allRecordsForStats.value.forEach(item => {
    const name = getViolationTypeName(item.vid)
    map.set(name, (map.get(name) || 0) + 1)
  })

  typeDistribution.value = Array.from(map).map(([typeName, count], i) => ({
    typeName: typeName,
    count: count,
    percentage: allTotalCount.value === 0 ? 0 : ((count / allTotalCount.value) * 100).toFixed(1),
    color: colors[i % colors.length]
  })).sort((a, b) => b.count - a.count)
}

const openEditModal = async (item) => {
  await loadPersonnelList()
  editForm.did = item.did
  editForm.vid = item.vid
  editForm.pid = item.pid
  editForm.status = item.status
  editVisible.value = true
}

const closeEditModal = () => {
  editVisible.value = false
}

const submitEdit = async () => {
  if (!editForm.did || !editForm.vid || !editForm.pid) {
    alert('请完善必填项')
    return
  }
  if (!confirm('确定保存？')) return

  try {
    const res = await recordUpdateService({
      did: editForm.did,
      vid: editForm.vid,
      pid: editForm.pid,
      status: editForm.status
    })
    if (res?.code === 200) {
      alert('✅ 修改成功')
      closeEditModal()
      await fetchRecords()
      await fetchAllRecordsForStats()
    } else {
      alert(res?.message || '修改失败')
    }
  } catch (e) {
    console.error(e)
    alert('修改失败')
  }
}

const displayPages = computed(() => {
  const pages = []
  const maxDisplay = 5
  const totalPageNum = Math.max(totalPages.value, 1)
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(totalPageNum, start + maxDisplay - 1)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const resetFilters = () => {
  filters.keyword = ''
  filters.status = ''
  filters.startDate = ''
  filters.endDate = ''
  handleSearch()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchRecords()
  fetchAllRecordsForStats()
}

let searchTimer = null
watch([() => filters.status, () => filters.startDate, () => filters.endDate], () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    handleSearch()
  }, 500)
})

const fetchRecords = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: 1,
      pageSize: 99999,
      keyword: filters.keyword.trim(),
      status: filters.status ? +filters.status : null,
      startDate: filters.startDate || null,
      endDate: filters.endDate || null
    }
    const res = await recordPageService(params)
    if (res?.code === 200) {
      const rawData = res.data.data || []
      // 按创建时间升序排序（旧的在前，新的在后）
      const sortedData = [...rawData].sort((a, b) => {
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
      allRawData.value = sortedData
      total.value = res.data.total || 0
      totalPages.value = Math.ceil(total.value / pageSize.value) || 1
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  const tp = Math.max(totalPages.value, 1)
  if (page < 1 || page > tp) return
  currentPage.value = page
}

const openDetailModal = (item) => {
  detailRecord.value = { ...item }
  detailVisible.value = true
  imageError.value = false
}
const closeDetailModal = () => detailVisible.value = false

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `/image/result-image?path=${encodeURIComponent(path)}`
}
const handleImageError = () => imageError.value = true

const getViolationTypeName = (vid) => {
  const typeMap = {
    1: '未佩戴安全帽',
    2: '未佩戴口罩',
    3: '未穿反光衣',
    4: '违规操作',
    5: '违规吸烟',
    6: '违规使用手机'
  }
  return typeMap[vid] || `类型${vid}`
}

const getStatusClass = (s) => s === 0 ? 'pending' : 'processed'
const getStatusText = (s) => s === 0 ? '待处理' : '已处理'

const formatTime = (s) => {
  if (!s) return '未知'
  try {
    return new Date(s).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).replace(/\//g, '-')
  } catch {
    return '未知'
  }
}

const confirmDelete = (item) => {
  handleDelete(item.did)
}

// 修复删除函数 - 只要请求成功就认为删除成功
const handleDelete = async (did) => {
  if (!confirm(`确定删除 #${did}？`)) return

  try {
    await recordDeleteService(did)
    // 执行到这里说明请求成功，删除成功
    alert('删除成功')

    // 刷新数据
    await fetchRecords()
    await fetchAllRecordsForStats()

    // 如果当前页没有数据了，且不是第一页，自动跳转到上一页
    if (currentPageData.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert(error?.response?.data?.message || error?.message || '删除失败，请稍后重试')
  }
}

onMounted(() => {
  loadTypeList()
  fetchRecords()
  fetchAllRecordsForStats()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.violation-management {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 20px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
}
.filter-select, .filter-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  outline: none;
}
.btn-header {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.search-box {
  display: flex;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}
.search-box input {
  padding: 8px 12px;
  border: none;
  outline: none;
  width: 200px;
}
.search-btn {
  padding: 8px 12px;
  border: none;
  background: #f5f7fa;
  cursor: pointer;
}

.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}
.table-section {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.section-header {
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.violation-table {
  width: 100%;
  border-collapse: collapse;
}
.violation-table th, .violation-table td {
  padding: 12px 24px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}
.type-tag {
  padding: 2px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
}
.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status-tag.pending { background: #fef3c7; color: #d97706; }
.status-tag.processed { background: #d1fae5; color: #047857; }

.actions {
  display: flex;
  gap: 6px;
}
.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
}
.action-btn:hover {
  background: #f0f7ff;
  color: #1677ff;
}

.empty-data {
  text-align: center;
  padding: 50px 0;
  color: #999;
}

.pagination-wrapper {
  border-top: 1px solid #f0f0f0;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  max-width: 100%;
  overflow-x: auto;
  white-space: nowrap;
}
.page-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  flex-shrink: 0;
}
.page-btn.active {
  background: #1677ff;
  color: #fff;
}

.sidebar-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}
.card-title {
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-badge {
  font-size: 12px;
  font-weight: normal;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  color: #666;
}
.distribution-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
.distribution-total {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.item-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.item-right {
  font-weight: 500;
}
.color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.color-dot.red { background: #dc2626; }
.color-dot.orange { background: #ea580c; }
.color-dot.green { background: #059669; }
.color-dot.blue { background: #2563eb; }
.color-dot.purple { background: #9333ea; }
.color-dot.gray { background: #6b7280; }
.color-dot.pending { background: #d97706; }
.color-dot.processed { background: #047857; }

.loading-small {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #999;
}
.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-container {
  text-align: center;
  padding: 50px;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.detail-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.detail-content {
  background: #fff;
  border-radius: 10px;
  max-width: 700px;
  width: 100%;
  padding: 20px;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
.image-wrapper {
  border: 1px dashed #eee;
  padding: 20px;
  text-align: center;
}
.detail-image {
  max-width: 100%;
  max-height: 400px;
}

.edit-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.edit-content {
  background: #fff;
  border-radius: 10px;
  max-width: 500px;
  width: 100%;
  overflow: hidden;
}
.edit-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
}
.edit-body {
  padding: 24px;
}
.form-item {
  margin-bottom: 16px;
}
.form-item label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.edit-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-cancel {
  padding: 6px 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
.btn-save {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  background: #1677ff;
  color: #fff;
  cursor: pointer;
}
</style>