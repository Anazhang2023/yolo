<template>
  <div>
    <!-- 列表页面 -->
    <div v-if="currentView === 'list'" class="personnel-wrapper">
      <div class="personnel-card">
        <!-- 页面标题 -->
        <div class="page-header">
          <h1>工作人员管理</h1>
        </div>

        <!-- 操作栏（新增部门筛选下拉框） -->
        <div class="action-bar">
          <button class="btn-primary" @click="showAddPage">➕ 新增人员</button>

          <!-- 新增：搜索区域组合（关键词+部门） -->
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
              <th style="width: 100px;">操作</th>
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
import PersonnelAdd from './PersonnelAdd.vue'
import PersonnelUpdate from './PersonnelUpdate.vue'

// 核心数据
const currentView = ref('list')
const currentEditPerson = ref(null)
const personnelList = ref([])
const departmentList = ref([])
const loading = ref(false)
const searchKeyword = ref('')
// 新增：选中的部门ID（空=全部部门）
const selectedDeptId = ref('')

// 分页参数
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)
const totalPages = ref(0)

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

// 核心修改：获取分页数据（新增部门筛选参数）
const fetchPersonnelPage = async () => {
  loading.value = true
  try {
    // 传递关键词 + 部门ID 给后端
    const res = await personnelPageService({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value.trim(),
      deptId: selectedDeptId.value // 新增：部门筛选参数
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

// 搜索处理（关键词/部门变化都触发）
const handleSearch = () => {
  currentPage.value = 1 // 搜索后重置到第一页
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

/* 新增：搜索组合区域样式 */
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

/* 新增：部门筛选下拉框样式 */
.dept-select {
  width: 180px;
}

.dept-select select {
  width: 100%;
  padding: 12px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  color: #666;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s;
}

.dept-select select:focus {
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
  border-radius: 6px;
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
  .search-box input, .dept-select select {
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
}

/* 自定义删除弹窗样式 */
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
</style>
