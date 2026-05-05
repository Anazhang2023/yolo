<template>
  <div class="personnel-edit-wrapper">
    <div class="personnel-edit-card">
      <!-- 左侧装饰区域 -->
      <div class="personnel-edit-left">
        <div class="left-content">
          <h2>人员安全检测系统</h2>
          <p class="subtitle">基于 SpringBoot + YOLO</p>
          <div class="slogan">
          </div>
        </div>
      </div>

      <!-- 右侧表单区域 -->
      <div class="personnel-edit-right">
        <!-- 加载状态 -->
        <div v-if="loading" class="edit-loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else class="edit-content">
          <div class="edit-form">
            <!-- pid (隐藏或只读) -->
            <div class="form-group">
              <label>ID</label>
              <div class="input-wrapper">
                <span class="input-icon">#</span>
                <input type="text" v-model="formData.pid" disabled>
              </div>
            </div>

            <!-- p_name -->
            <div class="form-group">
              <label>姓名 <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input
                    type="text"
                    v-model="formData.pName"
                    maxlength="50"
                    placeholder="请输入姓名"
                >
              </div>
            </div>

            <!-- phone -->
            <div class="form-group">
              <label>手机号码</label>
              <div class="input-wrapper">
                <span class="input-icon">📱</span>
                <input
                    type="tel"
                    v-model="formData.phone"
                    maxlength="20"
                    placeholder="请输入手机号码"
                >
              </div>
            </div>

            <!-- email -->
            <div class="form-group">
              <label>邮箱地址</label>
              <div class="input-wrapper">
                <span class="input-icon">📧</span>
                <input
                    type="email"
                    v-model="formData.email"
                    maxlength="100"
                    placeholder="请输入邮箱地址"
                >
              </div>
            </div>

            <!-- department_id 下拉选择 -->
            <div class="form-group">
              <label>所属部门 <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">🏢</span>
                <select v-model="formData.departmentId" class="department-select">
                  <option value="">请选择部门</option>
                  <option v-for="dept in departmentList" :key="dept.deid" :value="dept.deid">
                    {{ dept.deName }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 累计违规（不可修改） -->
            <div class="form-group">
              <label>累计违规</label>
              <div class="input-wrapper">
                <span class="input-icon">⚠️</span>
                <input
                    type="number"
                    v-model="formData.totalViolations"
                    min="0"
                    disabled
                    placeholder="累计违规次数"
                >
              </div>
            </div>

            <!-- 待处理（不可修改） -->
            <div class="form-group">
              <label>待处理</label>
              <div class="input-wrapper">
                <span class="input-icon">📋</span>
                <input
                    type="number"
                    v-model="formData.pendingViolations"
                    min="0"
                    disabled
                    placeholder="待处理违规次数"
                >
              </div>
            </div>

            <!-- 按钮组 -->
            <div class="button-group">
              <button class="btn-cancel" @click="handleCancel">取消</button>
              <button class="btn-submit" @click="handleSubmit">保存修改</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
// 导入接口
import { personnelGetByIdService, personnelUpdateService } from '@/api/personnel'
import { departmentGetAllService } from '@/api/department'

// 接收父组件传递的人员信息（主要取pid）
const props = defineProps({
  person: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

// 定义回传事件
const emit = defineEmits(['back-to-list'])

// 状态管理
const loading = ref(false) // 加载状态
const departmentList = ref([]) // 部门列表
const formData = ref({
  pid: '',
  pName: '',
  phone: '',
  email: '',
  departmentId: '',
  totalViolations: 0,
  pendingViolations: 0
})

// // 获取部门列表（修复ESLint条件覆盖问题）
// const getDepartmentList = async () => {
//   try {
//     const res = await departmentGetAllService()
//     let deptData = []
//     // 重构条件判断：先判断特殊格式，再判断通用格式（避免覆盖）
//     if (res && res.code === 200 && res.data) {
//       deptData = Array.isArray(res.data) ? res.data : []
//     } else if (res && res.data) {
//       deptData = Array.isArray(res.data) ? res.data : []
//     } else if (Array.isArray(res)) {
//       deptData = res
//     }
//     departmentList.value = deptData
//   } catch (error) {
//     console.error('获取部门列表失败：', error)
//     departmentList.value = []
//   }
// }
// 获取部门列表（简化版）
const getDepartmentList = async () => {
  try {
    const res = await departmentGetAllService()
    console.log('部门列表返回:', res) // 先看这里！

    // 直接取数据
    if (res && res.code === 200) {
      departmentList.value = res.data || []
    } else if (Array.isArray(res)) {
      departmentList.value = res
    } else {
      departmentList.value = []
    }

    console.log('处理后部门列表:', departmentList.value) // 再看这里！
  } catch (error) {
    console.error('获取部门列表失败：', error)
    departmentList.value = []
  }
}
// 初始化：根据pid查询人员详情（修复ESLint条件覆盖问题）
const initPersonnelData = async () => {
  // 校验pid是否存在
  if (!props.person || !props.person.pid) {
    alert('人员ID不能为空！')
    emit('back-to-list')
    return
  }

  loading.value = true
  try {
    const res = await personnelGetByIdService(props.person.pid)
    let personData = {}
    // 重构条件判断：先判断带code的格式，再判断通用格式
    if (res && res.code === 200 && res.data) {
      personData = res.data
    } else if (res) {
      personData = res
    }

    // 赋值到表单（兼容字段名）
    formData.value = {
      pid: personData.pid || props.person.pid || '',
      pName: personData.pName || personData.name || '',
      phone: personData.phone || '',
      email: personData.email || '',
      departmentId: personData.departmentId || personData.deptId || '',
      totalViolations: personData.totalViolations || personData.total_violations || 0,
      pendingViolations: personData.pendingViolations || personData.pending_violations || 0
    }
  } catch (error) {
    console.error('查询人员详情失败：', error)
    // 兼容：如果接口报错，先用父组件传递的基础数据回显
    formData.value = {
      pid: props.person.pid || '',
      pName: props.person.pName || '',
      phone: props.person.phone || '',
      email: props.person.email || '',
      departmentId: props.person.departmentId || '',
      totalViolations: props.person.totalViolations || 0,
      pendingViolations: props.person.pendingViolations || 0
    }
    alert('获取人员详情失败，使用基础数据编辑')
  } finally {
    loading.value = false
  }
}

// 初始化加载
onMounted(async () => {
  await getDepartmentList() // 先加载部门列表
  await initPersonnelData() // 再加载人员信息
})

// 监听person变化（防止父组件重新传值时数据不更新）
watch(() => props.person, (newVal) => {
  if (newVal && newVal.pid) {
    initPersonnelData()
  }
}, { immediate: false })

// 取消按钮：返回列表
const handleCancel = () => {
  emit('back-to-list')
}

// 提交修改（修复ESLint条件覆盖问题）
const handleSubmit = async () => {
  // 表单基础校验
  if (!formData.value.pName) {
    alert('姓名不能为空！')
    return
  }
  if (!formData.value.departmentId) {
    alert('请选择所属部门！')
    return
  }

  loading.value = true
  try {
    const res = await personnelUpdateService(formData.value)
    // 重构成功判断逻辑：避免条件覆盖
    let isSuccess = false
    if (res && res.code === 200) {
      isSuccess = true
    } else if (res && !res.code) {
      isSuccess = true
    }

    if (isSuccess) {
      alert('修改成功！')
      emit('back-to-list')
    } else {
      alert('修改失败：' + (res?.message || '服务器错误'))
    }
  } catch (error) {
    console.error('修改人员信息失败：', error)
    alert('修改失败：网络异常，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<script>
export default {
  name: 'PersonnelUpdate'
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.personnel-edit-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

/* 白色卡片 */
.personnel-edit-card {
  display: flex;
  width: 100%;
  max-width: 900px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* 左侧区域 */
.personnel-edit-left {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
}

.left-content h2 {
  font-size: 32px;
  margin-bottom: 15px;
  font-weight: 600;
}

.left-content .subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.left-content .slogan {
  font-size: 16px;
  opacity: 0.8;
  line-height: 1.8;
}

/* 右侧区域 */
.personnel-edit-right {
  flex: 1.2;
  padding: 50px 40px;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 600px;
}

/* 加载状态 */
.edit-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 40px 0;
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

.edit-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.form-header {
  margin-bottom: 30px;
}

.form-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 6px;
  font-weight: 600;
}

.form-header p {
  color: #666;
  font-size: 14px;
}

.edit-form {
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
  flex: 1;
}

/* 表单组 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

.form-group .required {
  color: #e53e3e;
  margin-left: 2px;
}

/* 输入框包装 */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #999;
  font-size: 16px;
  z-index: 1;
}

.input-wrapper input,
.input-wrapper select {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  background: #fafafa;
}

/* 部门下拉框样式 */
.department-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px !important;
}

.input-wrapper input:focus,
.input-wrapper select:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-wrapper input::placeholder,
.input-wrapper select::placeholder {
  color: #aaa;
  font-size: 13px;
}

.input-wrapper input:disabled {
  background: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  flex: 2;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .personnel-edit-card {
    flex-direction: column;
  }

  .personnel-edit-left {
    padding: 40px 20px;
  }

  .personnel-edit-right {
    padding: 30px 20px;
    min-height: auto;
  }

  .button-group {
    flex-direction: column;
  }
}
</style>