<template>
  <div>
    <!-- 列表页面 -->
    <div v-if="currentView === 'list'" class="personnel-wrapper">
      <div class="personnel-card">
        <!-- 页面标题 -->
        <div class="page-header">
          <h1>工作人员管理</h1>
        </div>

        <!-- 操作栏 -->
        <div class="action-bar">
          <button class="btn-primary" @click="showAddPage">➕ 新增人员</button>

          <!-- 搜索区域 -->
          <div class="search-group">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                  type="text"
                  placeholder="搜索姓名/电话/ID"
                  v-model="searchKeyword"
                  @input="handleSearch"
                  @keyup.enter="handleSearch"
              >
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 工作人员列表表格 -->
        <div v-else class="table-container">
          <table class="personnel-table">
            <thead>
            <tr>
              <th style="width: 60px;">ID</th>
              <th style="width: 80px;">姓名</th>
              <th style="width: 100px;">部门</th>
              <th style="width: 130px;">联系电话</th>
              <th style="width: 200px;">邮箱</th>
              <th style="width: 100px;">累计违规</th>
              <th style="width: 100px;">待处理</th>
              <th style="width: 150px;">操作</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="person in personnelList" :key="person.pid">
              <td>{{ person.pid }}</td>
              <td>{{ person.pName || '未填写' }}</td>
              <td>{{ getDepartmentName(person.departmentId) }}</td>
              <td>{{ person.phone || '暂无' }}</td>
              <td class="text-ellipsis">{{ person.email || '暂无' }}</td>
              <td class="text-center">{{ person.totalViolations || 0 }}</td>
              <td class="text-center">{{ person.pendingViolations || 0 }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" title="编辑" @click="showEditPage(person)">✏️</button>
                  <button class="btn-icon" title="删除" @click="showDeleteModal(person)">🗑️</button>
                  <button class="btn-icon" title="查看违规记录" @click="showViolationRecords(person)">📋</button>
                </div>
              </td>
            </tr>
            <tr v-if="personnelList.length === 0">
              <td colspan="8" class="text-center empty-data">暂无数据</td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页组件 -->
        <div class="pagination-wrapper" v-if="totalCount > 0">
          <div class="pagination-left">
            <span class="total-text">共 {{ totalCount }} 条数据</span>
            <div class="page-size-select">
              <label>每页显示：</label>
              <select v-model="pageSize" @change="handleSizeChange">
                <option value="5">5条</option>
                <option value="10">10条</option>
                <option value="20">20条</option>
                <option value="50">50条</option>
              </select>
            </div>
          </div>

          <div class="pagination-right">
            <button
                class="page-btn"
                @click="handlePageChange(currentPage - 1)"
                :disabled="currentPage <= 1"
            >
              上一页
            </button>

            <button v-if="pageNumbers[0] > 1" class="page-num" @click="handlePageChange(1)">1</button>
            <span v-if="pageNumbers[0] > 2" class="page-ellipsis">...</span>

            <button
                v-for="page in pageNumbers"
                :key="page"
                class="page-num"
                :class="{ active: currentPage === page }"
                @click="handlePageChange(page)"
            >
              {{ page }}
            </button>

            <span v-if="pageNumbers[pageNumbers.length-1] < totalPages - 1" class="page-ellipsis">...</span>
            <button
                v-if="pageNumbers[pageNumbers.length-1] < totalPages"
                class="page-num"
                @click="handlePageChange(totalPages)"
            >
              {{ totalPages }}
            </button>

            <button
                class="page-btn"
                @click="handlePageChange(currentPage + 1)"
                :disabled="currentPage >= totalPages"
            >
              下一页
            </button>

            <span class="page-info">第 {{ currentPage }}/{{ totalPages }} 页</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑页面 -->
    <div v-else-if="currentView === 'add'">
      <PersonnelAdd @back-to-list="showListPage" />
    </div>
    <div v-else-if="currentView === 'edit'">
      <PersonnelUpdate :person="currentEditPerson" @back-to-list="showListPage" />
    </div>

    <!-- 违规记录弹窗 -->
    <div class="modal-mask" v-if="violationModalVisible" @click.self="closeViolationModal">
      <div class="violation-modal-container">
        <div class="modal-header">
          <h3>违规记录 - {{ currentPerson.pName }}</h3>
          <button class="modal-close-btn" @click="closeViolationModal">×</button>
        </div>
        <div class="modal-body">
          <!-- 统计卡片 -->
          <div class="stats-cards">
            <div class="stat-card total">
              <div class="stat-value">{{ violationRecords.length }}</div>
              <div class="stat-label">总违规次数</div>
            </div>
            <div class="stat-card pending">
              <div class="stat-value">{{ violationRecords.filter(v => v.status === 0).length }}</div>
              <div class="stat-label">待处理</div>
            </div>
            <div class="stat-card processed">
              <div class="stat-value">{{ violationRecords.filter(v => v.status === 1).length }}</div>
              <div class="stat-label">已处理</div>
            </div>
          </div>

          <!-- 违规记录表格 -->
          <div class="violation-table-container" v-if="violationRecords.length > 0">
            <table class="violation-records-table">
              <thead>
              <tr>
                <th>序号</th>
                <th>违规时间</th>
                <th>违规类型</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(record, index) in violationRecords" :key="record.did">
                <td>{{ index + 1 }}</td>
                <td>{{ formatTime(record.createdAt) }}</td>
                <td>
                  <span class="violation-type-tag">{{ getViolationTypeName(record.vid) }}</span>
                </td>
                <td>
                    <span :class="['status-tag', record.status === 0 ? 'pending' : 'processed']">
                      {{ record.status === 0 ? '待处理' : '已处理' }}
                    </span>
                </td>
                <td>
                  <button class="view-detail-btn" @click="viewRecordDetail(record)">查看详情</button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-violation">
            <span class="empty-icon">✅</span>
            <p>该人员暂无违规记录</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="closeViolationModal">关闭</button>
        </div>
      </div>
    </div>

    <!-- 违规记录详情弹窗 -->
    <div class="modal-mask" v-if="recordDetailVisible" @click.self="closeRecordDetail">
      <div class="record-detail-container">
        <div class="modal-header">
          <h3>违规详情 #{{ currentRecord.did }}</h3>
          <button class="modal-close-btn" @click="closeRecordDetail">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-info-grid">
            <div class="detail-item">
              <label>违规类型：</label>
              <span class="violation-type-tag">{{ getViolationTypeName(currentRecord.vid) }}</span>
            </div>
            <div class="detail-item">
              <label>违规时间：</label>
              <span>{{ formatTime(currentRecord.createdAt) }}</span>
            </div>
            <div class="detail-item">
              <label>当前状态：</label>
              <span :class="['status-tag', currentRecord.status === 0 ? 'pending' : 'processed']">
                {{ currentRecord.status === 0 ? '待处理' : '已处理' }}
              </span>
            </div>
          </div>
          <div class="image-preview" v-if="currentRecord.imagePath">
            <label>现场图片：</label>
            <img
                :src="getImageUrl(currentRecord.imagePath)"
                alt="违规图片"
                class="violation-image"
                @error="handleImageError"
            />
          </div>
          <div v-else class="no-image">
            <span>暂无现场图片</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="closeRecordDetail">关闭</button>
        </div>
      </div>
    </div>

    <!-- 自定义删除确认弹窗 -->
    <div class="modal-mask" v-if="deleteModalVisible">
      <div class="modal-container">
        <div class="modal-header">
          <h3>删除确认</h3>
        </div>
        <div class="modal-body">
          <p>确定要删除工作人员【{{ deletePerson.pName || '未命名' }}】吗？删除后数据无法恢复！</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="hideDeleteModal">取消</button>
          <button class="modal-btn confirm-btn" @click="confirmDeleteAction">确定删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
// 导入接口
import { personnelPageService, personnelDeleteService } from '@/api/personnel'
import { departmentGetAllService } from '@/api/department'
import { recordGetByPersonnelService } from '@/api/record'
import PersonnelAdd from './PersonnelAdd.vue'
import PersonnelUpdate from './PersonnelUpdate.vue'


// 核心数据
const currentView = ref('list')
const currentEditPerson = ref(null)
const personnelList = ref([])
const departmentList = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const selectedDeptId = ref('')

// 分页参数
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)
const totalPages = ref(0)

// 违规记录弹窗相关
const violationModalVisible = ref(false)
const currentPerson = ref({})
const violationRecords = ref([])
const recordsLoading = ref(false)

// 违规记录详情弹窗
const recordDetailVisible = ref(false)
const currentRecord = ref({})

// 删除弹窗相关
const deleteModalVisible = ref(false)
const deletePerson = ref({})

// 页码显示逻辑
const pageNumbers = computed(() => {
  const pages = []
  const half = 2
  const total = totalPages.value
  if (total === 0) return pages

  let start = Math.max(1, currentPage.value - half)
  let end = Math.min(total, currentPage.value + half)

  if (end - start < 2 * half) {
    if (start === 1) {
      end = Math.min(total, start + 2 * half)
    } else if (end === total) {
      start = Math.max(1, end - 2 * half)
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// 获取部门名称
const getDepartmentName = (deptId) => {
  if (!deptId) return '未分配'
  const dept = departmentList.value.find(d => d.deid === deptId || d.id === deptId)
  return dept ? (dept.deName || dept.name) : '未分配'
}

// 获取违规类型名称
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

// 格式化时间
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

// 获取图片URL
const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `/image/result-image?path=${encodeURIComponent(path)}`
}

const handleImageError = (e) => {
  e.target.src = ''
  e.target.alt = '图片加载失败'
}

// 获取部门列表
const fetchDepartmentList = async () => {
  try {
    const res = await departmentGetAllService()
    departmentList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取部门列表错误:', error)
    alert('获取部门列表失败')
  }
}

// 获取分页数据
const fetchPersonnelPage = async () => {
  loading.value = true
  try {
    const res = await personnelPageService({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value.trim(),
      deptId: selectedDeptId.value
    })

    if (res && res.code === 200) {
      personnelList.value = res.data.data || []
      totalCount.value = res.data.total || 0
      totalPages.value = res.data.totalPages || 0
    } else {
      alert(res?.message || '获取列表失败')
      personnelList.value = []
      totalCount.value = 0
      totalPages.value = 0
    }
  } catch (error) {
    console.error('获取分页列表错误:', error)
    alert('网络错误，请重试')
    personnelList.value = []
    totalCount.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
}

// 获取人员的违规记录（适配字段名：id->did, personnelId->pid, violationTypeId->vid）
const fetchViolationRecords = async (pid) => {
  recordsLoading.value = true
  try {
    const res = await recordGetByPersonnelService(pid)
    console.log('接口返回原始数据:', res)

    // 处理返回数据，适配字段名
    let records = []
    if (res && res.code === 200) {
      records = res.data || []
    } else if (Array.isArray(res)) {
      records = res
    } else if (res && res.data && Array.isArray(res.data)) {
      records = res.data
    }

    // 统一字段名转换：id -> did, personnelId -> pid, violationTypeId -> vid
    violationRecords.value = records.map(record => ({
      did: record.id || record.did,
      pid: record.personnelId || record.pid,
      vid: record.violationTypeId || record.vid,
      imagePath: record.imagePath,
      createdAt: record.createdAt,
      status: record.status
    }))

    console.log('转换后的违规记录:', violationRecords.value)

  } catch (error) {
    console.error('获取违规记录失败:', error)
    violationRecords.value = []
    alert('获取违规记录失败')
  } finally {
    recordsLoading.value = false
  }
}

// 显示违规记录弹窗
const showViolationRecords = async (person) => {
  currentPerson.value = person
  violationModalVisible.value = true
  await fetchViolationRecords(person.pid)
}

// 关闭违规记录弹窗
const closeViolationModal = () => {
  violationModalVisible.value = false
  currentPerson.value = {}
  violationRecords.value = []
}

// 查看违规记录详情
const viewRecordDetail = (record) => {
  currentRecord.value = record
  recordDetailVisible.value = true
}

// 关闭记录详情弹窗
const closeRecordDetail = () => {
  recordDetailVisible.value = false
  currentRecord.value = {}
}

// 分页事件
const handlePageChange = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchPersonnelPage()
}

const handleSizeChange = () => {
  currentPage.value = 1
  fetchPersonnelPage()
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchPersonnelPage()
}

// 页面切换
const showAddPage = () => { currentView.value = 'add' }
const showEditPage = (person) => {
  currentEditPerson.value = { ...person }
  currentView.value = 'edit'
}
const showListPage = () => {
  currentView.value = 'list'
  currentPage.value = 1
  fetchPersonnelPage()
}

// 删除弹窗控制
const showDeleteModal = (person) => {
  deletePerson.value = person
  deleteModalVisible.value = true
}

const hideDeleteModal = () => {
  deleteModalVisible.value = false
}

// 确认删除操作
const confirmDeleteAction = async () => {
  try {
    const res = await personnelDeleteService(deletePerson.value.pid)
    const isSuccess = !res.code || res.code === 200
    if (isSuccess) {
      alert(`工作人员【${deletePerson.value.pName || '未命名'}】删除成功！`)
      fetchPersonnelPage()
    } else {
      alert(res.message || '删除失败')
    }
  } catch (error) {
    console.error('删除错误:', error)
    alert('网络异常，删除失败，请重试！')
  }
  hideDeleteModal()
}

// 初始化
onMounted(() => {
  fetchDepartmentList()
  fetchPersonnelPage()
})
</script>

<style scoped>
/* 原有样式保留 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.personnel-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 30px 20px;
}

.personnel-card {
  width: 100%;
  max-width: 1300px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  margin-top: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #999;
  font-size: 16px;
  z-index: 1;
}

.search-box input {
  width: 300px;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
  background: #fafafa;
}

.search-box input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.loading-container {
  text-align: center;
  padding: 50px;
}

.loading-spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}

.personnel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.personnel-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  color: #555;
  font-weight: 600;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.personnel-table td {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  color: #333;
}

.personnel-table tbody tr:hover {
  background: #f5f5f5;
}

.text-center {
  text-align: center;
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-data {
  padding: 40px;
  color: #999;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #f0f0f0;
  color: #667eea;
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  font-size: 14px;
  color: #666;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.total-text {
  color: #666;
  font-size: 14px;
}

.page-size-select {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-select select {
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: border 0.2s;
}

.page-size-select select:focus {
  outline: none;
  border-color: #667eea;
}

.pagination-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #fafafa;
}

.page-num {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.page-num.active {
  background: #667eea;
  color: white;
  font-weight: 600;
}

.page-num:hover:not(.active) {
  background: #f5f5f5;
  color: #667eea;
}

.page-ellipsis {
  color: #999;
  padding: 0 4px;
}

.page-info {
  margin-left: 10px;
  color: #666;
}

/* 违规记录弹窗样式 */
.violation-modal-container {
  width: 800px;
  max-width: 90%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  color: #333;
}

/* 统计卡片 */
.stats-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.stat-card {
  flex: 1;
  text-align: center;
  padding: 16px;
  border-radius: 10px;
  background: #f8f9fa;
}

.stat-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card.pending {
  background: #fff3e0;
  color: #e67e22;
}

.stat-card.processed {
  background: #e8f8f5;
  color: #27ae60;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  opacity: 0.8;
}

/* 违规记录表格 */
.violation-table-container {
  max-height: 400px;
  overflow-y: auto;
}

.violation-records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.violation-records-table th,
.violation-records-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.violation-records-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
  position: sticky;
  top: 0;
}

.violation-type-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 12px;
  color: #666;
}

.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.status-tag.pending {
  background: #fef3c7;
  color: #d97706;
}

.status-tag.processed {
  background: #d1fae5;
  color: #047857;
}

.view-detail-btn {
  padding: 4px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.view-detail-btn:hover {
  background: #5a67d8;
}

.empty-violation {
  text-align: center;
  padding: 50px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

/* 违规详情弹窗 */
.record-detail-container {
  width: 500px;
  max-width: 90%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-item label {
  font-weight: 600;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.image-preview {
  text-align: center;
}

.image-preview label {
  font-weight: 600;
  color: #666;
  display: block;
  margin-bottom: 8px;
}

.violation-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.no-image {
  text-align: center;
  padding: 40px;
  color: #999;
}

/* 模态框通用样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-container {
  width: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.modal-body {
  padding: 20px;
  font-size: 14px;
  color: #666;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  border: 1px solid #e5e5e5;
}

.cancel-btn {
  background: white;
  color: #666;
}

.cancel-btn:hover {
  background: #f5f5f5;
}

.confirm-btn {
  background: #ff4d4f;
  color: white;
  border: 1px solid #ff4d4f;
}

.confirm-btn:hover {
  background: #ff7875;
}

@media (max-width: 768px) {
  .personnel-card {
    padding: 20px;
  }
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-group {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .search-box input {
    width: 100%;
  }
  .pagination-wrapper {
    flex-direction: column;
    align-items: flex-start;
  }
  .pagination-right {
    width: 100%;
    justify-content: center;
  }
  .violation-modal-container {
    width: 95%;
  }
}
</style>