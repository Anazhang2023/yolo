<template>
  <div class="user-add-wrapper">
    <div class="user-add-card">
      <!-- 左侧装饰区域 -->
      <div class="user-add-left">
        <div class="left-content">
          <h2>人员安全检测系统</h2>
          <p class="subtitle">基于 SpringBoot + YOLO</p>
        </div>
      </div>

      <!-- 右侧表单区域 -->
      <div class="user-add-right">
        <div class="form-header">
          <h1>创建账户</h1>
          <p>填写信息创建您的账户</p>
        </div>

        <div class="add-form">
          <!-- 用户名 -->
          <div class="form-group">
            <label>用户名 <span class="required">*</span></label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input
                  type="text"
                  v-model="form.uName"
                  placeholder="请输入用户名"
                  @input="clearError"
                  required
              >
            </div>
          </div>

          <!-- 密码 -->
          <div class="form-group">
            <label>密码 <span class="required">*</span></label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input
                  type="password"
                  v-model="form.password"
                  placeholder="请输入密码（至少6位）"
                  @input="clearError"
                  required
              >
            </div>
          </div>

          <!-- 确认密码 -->
          <div class="form-group">
            <label>确认密码 <span class="required">*</span></label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input
                  type="password"
                  v-model="form.confirmPassword"
                  placeholder="请再次输入密码"
                  @input="checkPasswordMatch"
                  required
              >
            </div>
            <!-- 密码不一致提示 -->
            <div v-if="passwordError" class="error-tip">
              <span class="error-icon">⚠️</span> {{ passwordError }}
            </div>
          </div>

          <!-- 注册按钮 -->
          <button class="register-btn" @click="handleRegister" :disabled="loading">
            <span v-if="loading" class="loading-spinner"></span>
            {{ loading ? '注册中...' : '注册' }}
          </button>

          <!-- 登录链接 -->
          <div class="login-link">
            已有账户？ <a href="#" @click.prevent="goToLogin">立即登录</a>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMsg" class="error-msg">
            <span class="error-icon">❌</span> {{ errorMsg }}
          </div>

          <!-- 成功提示 -->
          <div v-if="successMsg" class="success-msg">
            <span class="success-icon">✓</span> {{ successMsg }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { userRegisterService } from '@/api/user'

const emit = defineEmits(['back-to-login'])

// 表单数据
const form = reactive({
  uName: '',
  password: '',
  confirmPassword: ''
})

// 状态
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const passwordError = ref('')

// 清除错误提示
const clearError = () => {
  errorMsg.value = ''
  successMsg.value = ''
}

// 检查密码是否一致
const checkPasswordMatch = () => {
  if (form.confirmPassword && form.password !== form.confirmPassword) {
    passwordError.value = '两次输入的密码不一致'
  } else {
    passwordError.value = ''
  }
}

// 表单验证
const validateForm = () => {
  // 清空之前的错误
  errorMsg.value = ''

  // 验证用户名
  if (!form.uName || form.uName.trim() === '') {
    errorMsg.value = '用户名不能为空'
    return false
  }

  if (form.uName.length < 3) {
    errorMsg.value = '用户名长度不能小于3位'
    return false
  }

  if (form.uName.length > 20) {
    errorMsg.value = '用户名长度不能超过20位'
    return false
  }

  // 验证密码
  if (!form.password) {
    errorMsg.value = '密码不能为空'
    return false
  }

  if (form.password.length < 6) {
    errorMsg.value = '密码长度不能小于6位'
    return false
  }

  if (form.password.length > 20) {
    errorMsg.value = '密码长度不能超过20位'
    return false
  }

  // 验证确认密码
  if (form.password !== form.confirmPassword) {
    errorMsg.value = '两次输入的密码不一致'
    return false
  }

  return true
}

// 处理注册
const handleRegister = async () => {
  // 验证表单
  if (!validateForm()) {
    return
  }

  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    // 调用注册接口
    const response = await userRegisterService({
      uName: form.uName.trim(),
      uPassword: form.password
    })

    console.log('后端返回数据:', response)

    // 判断返回结果（根据实际后端返回结构调整）
    // 常见情况1: response.code === 200 或 response.code === 0 表示成功
    // 常见情况2: response.data.code
    // 常见情况3: response.success

    let isSuccess = false
    let message = ''

    // 处理不同的返回格式
    if (response.code !== undefined) {
      // 格式1: { code: 200, message: "成功", data: {} }
      isSuccess = response.code === 200 || response.code === 0
      message = response.message
    } else if (response.data && response.data.code !== undefined) {
      // 格式2: { data: { code: 200, message: "成功" } }
      isSuccess = response.data.code === 200 || response.data.code === 0
      message = response.data.message
    } else if (response.success !== undefined) {
      // 格式3: { success: true, message: "成功" }
      isSuccess = response.success === true
      message = response.message
    } else if (response.status === 200) {
      // 格式4: HTTP状态码判断
      isSuccess = true
      message = response.message || '注册成功'
    } else {
      // 默认处理
      isSuccess = false
      message = response.message || response.msg || '注册失败'
    }

    if (isSuccess) {
      // 注册成功
      successMsg.value = message || '注册成功！3秒后跳转到登录页...'

      // 3秒后自动跳转
      setTimeout(() => {
        emit('back-to-login')
      }, 3000)
    } else {
      // 注册失败，显示后端返回的错误信息
      errorMsg.value = message || '注册失败，请重试'

      // 如果是用户名已存在，清空用户名输入框
      if (message && (message.includes('已存在') || message.includes('重复'))) {
        form.uName = ''
        form.password = ''
        form.confirmPassword = ''
      }
    }

  } catch (error) {
    console.error('注册错误:', error)

    // 处理网络错误或后端异常
    if (error.response) {
      // 服务器返回了错误状态码
      console.error('错误状态码:', error.response.status)
      console.error('错误数据:', error.response.data)

      const errorData = error.response.data
      if (errorData) {
        errorMsg.value = errorData.message || errorData.msg || `服务器错误 (${error.response.status})`
      } else {
        errorMsg.value = `服务器错误: ${error.response.status}`
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMsg.value = '网络连接失败，请检查网络后重试'
    } else {
      // 其他错误
      errorMsg.value = error.message || '注册失败，请重试'
    }
  } finally {
    loading.value = false
  }
}

// 返回登录页
const goToLogin = () => {
  emit('back-to-login')
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.user-add-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

/* 白色卡片 */
.user-add-card {
  display: flex;
  width: 100%;
  max-width: 1100px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 左侧区域 */
.user-add-left {
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
  animation: slideInLeft 0.5s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.left-content .subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.left-content .slogan {
  font-size: 16px;
  opacity: 0.8;
  line-height: 2;
}

.left-content .slogan p {
  margin: 10px 0;
  position: relative;
  display: inline-block;
}

/* 右侧区域 */
.user-add-right {
  flex: 1.2;
  padding: 60px 50px;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: 30px;
  animation: slideInRight 0.5s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.form-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
}

.form-header p {
  color: #666;
  font-size: 15px;
}

.add-form {
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.form-group {
  margin-bottom: 20px;
  animation: slideInRight 0.5s ease-out;
  animation-fill-mode: both;
}

.form-group:nth-child(1) { animation-delay: 0.1s; }
.form-group:nth-child(2) { animation-delay: 0.2s; }
.form-group:nth-child(3) { animation-delay: 0.3s; }

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

.required {
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
  font-size: 18px;
  transition: color 0.3s;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 12px 12px 42px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  background: #fafafa;
}

.input-wrapper input:hover {
  border-color: #b0b0b0;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-wrapper input:focus + .input-icon {
  color: #667eea;
}

.input-wrapper input::placeholder {
  color: #aaa;
  font-size: 13px;
}

/* 错误提示 */
.error-tip {
  color: #e53e3e;
  font-size: 12px;
  margin-top: 6px;
  padding-left: 5px;
  display: flex;
  align-items: center;
  animation: shake 0.3s ease-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.error-icon {
  margin-right: 4px;
}

/* 注册按钮 */
.register-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: slideInRight 0.5s ease-out;
  animation-delay: 0.4s;
  animation-fill-mode: both;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.register-btn:active:not(:disabled) {
  transform: translateY(0);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 登录链接 */
.login-link {
  margin-top: 25px;
  text-align: center;
  color: #666;
  font-size: 14px;
  animation: slideInRight 0.5s ease-out;
  animation-delay: 0.5s;
  animation-fill-mode: both;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  margin-left: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.login-link a:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* 错误消息 */
.error-msg {
  margin-top: 20px;
  padding: 12px;
  background: #fed7d7;
  color: #c53030;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: shake 0.3s ease-out;
}

/* 成功消息 */
.success-msg {
  margin-top: 20px;
  padding: 12px;
  background: #c6f6d5;
  color: #22543d;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeInUp 0.3s ease-out;
}

.success-icon {
  margin-right: 6px;
  font-weight: bold;
}

/* 响应式 */
@media (max-width: 768px) {
  .user-add-card {
    flex-direction: column;
    max-width: 500px;
  }

  .user-add-left {
    padding: 40px 20px;
  }

  .user-add-left h2 {
    font-size: 24px;
  }

  .user-add-right {
    padding: 40px 30px;
  }

  .form-header h1 {
    font-size: 28px;
  }

  .add-form {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .user-add-right {
    padding: 30px 20px;
  }

  .form-header h1 {
    font-size: 24px;
  }
}
</style>