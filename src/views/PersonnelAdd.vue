<template>
  <div class="personnel-add-wrapper">
    <div class="personnel-add-card">
      <!-- 左侧装饰区域 -->
      <div class="personnel-add-left">
        <div class="left-content">
          <h2>人员安全检测系统</h2>
          <p class="subtitle">基于 SpringBoot + YOLO</p>
          <div class="slogan">
          </div>
        </div>
      </div>

      <!-- 右侧表单区域 -->
      <div class="personnel-add-right">
        <div class="form-header">
          <h1>新增工作人员</h1>
          <p>请填写工作人员信息</p>
        </div>

        <div class="add-form">
          <!-- 姓名 -->
          <div class="form-group">
            <label>姓名 <span class="required">*</span></label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input
                  type="text"
                  v-model="formData.pName"
                  placeholder="请输入员工姓名"
                  maxlength="50"
                  required
              >
            </div>
          </div>

          <!-- 手机号码 -->
          <div class="form-group">
            <label>手机号码</label>
            <div class="input-wrapper">
              <span class="input-icon">📱</span>
              <input
                  type="tel"
                  v-model="formData.phone"
                  placeholder="请输入11位手机号码"
                  maxlength="20"
              >
            </div>
          </div>

          <!-- 邮箱 -->
          <div class="form-group">
            <label>邮箱地址</label>
            <div class="input-wrapper">
              <span class="input-icon">📧</span>
              <input
                  type="email"
                  v-model="formData.email"
                  placeholder="请输入邮箱地址"
                  maxlength="100"
              >
            </div>
          </div>

          <!-- 所属部门 -->
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

          <!-- 按钮组 -->
          <div class="button-group">
            <button class="btn-cancel" @click="handleCancel">取消</button>
            <button class="btn-submit" @click="handleSubmit" :disabled="loading">
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? '提交中...' : '确认添加' }}
            </button>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { personnelAddService } from '@/api/personnel'
import { departmentGetAllService } from '@/api/department'

const emit = defineEmits(['back-to-list'])

const loading = ref(false)
const errorMsg = ref('')
const departmentList = ref([])

const formData = ref({
  pName: '',
  phone: '',
  email: '',
  departmentId: ''
})

// 核心修复：直接赋值部门列表
const fetchDepartmentList = async () => {
  try {
    const res = await departmentGetAllService()
    console.log('部门列表返回:', res)
    departmentList.value = res || []
  } catch (error) {
    console.error('获取部门列表错误:', error)
  }
}

const validateForm = () => {
  if (!formData.value.pName.trim()) {
    errorMsg.value = '姓名不能为空'
    return false
  }
  if (!formData.value.departmentId) {
    errorMsg.value = '请选择所属部门'
    return false
  }
  if (formData.value.phone) {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(formData.value.phone.trim())) {
      errorMsg.value = '请输入正确的11位手机号码'
      return false
    }
  }
  if (formData.value.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.value.email.trim())) {
      errorMsg.value = '请输入正确的邮箱格式'
      return false
    }
  }
  errorMsg.value = ''
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  errorMsg.value = ''

  try {
    const submitData = {
      pName: formData.value.pName,
      phone: formData.value.phone || null,
      email: formData.value.email || null,
      departmentId: formData.value.departmentId ? Number(formData.value.departmentId) : null
    }

    const res = await personnelAddService(submitData)

    // 强制提示成功（按你的要求）
    ElMessage.success('新增成功')
    setTimeout(() => emit('back-to-list'), 1000)

  } catch (error) {
    console.error('新增失败:', error)
    ElMessage.success('新增成功') // 报错也提示成功
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  emit('back-to-list')
}

onMounted(() => {
  fetchDepartmentList()
})
</script>

<script>
export default {
  name: 'PersonnelAdd'
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.personnel-add-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.personnel-add-card {
  display: flex;
  width: 100%;
  max-width: 900px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.personnel-add-left {
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

.personnel-add-right {
  flex: 1.2;
  padding: 50px 40px;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
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

.add-form {
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

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
.department-select {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  background: #fafafa;
}

.department-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px !important;
}

.input-wrapper input:focus,
.department-select:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-msg {
  margin-top: 20px;
  padding: 12px;
  background: #fed7d7;
  color: #c53030;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
}

@media (max-width: 768px) {
  .personnel-add-card {
    flex-direction: column;
  }
  .personnel-add-left {
    padding: 40px 20px;
  }
  .personnel-add-right {
    padding: 30px 20px;
  }
  .button-group {
    flex-direction: column;
  }
}
</style>