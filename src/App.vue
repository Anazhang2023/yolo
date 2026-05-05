<template>
  <div>
    <!-- 如果显示注册页 -->
    <UserAdd v-if="showRegister" @back-to-login="showRegister = false" />

    <!-- 如果未登录且不显示注册页，显示登录页 -->
    <div v-else-if="!isLoggedIn" class="login-wrapper">
      <div class="login-card">
        <!-- 左侧区域 -->
        <div class="login-left">
          <div class="left-content">
            <h2>人员安全检测系统</h2>
            <p class="subtitle">基于 SpringBoot + YOLO</p>
          </div>
        </div>

        <!-- 右侧表单 -->
        <div class="login-right">
          <div class="form-header">
            <h1>欢迎登录</h1>
            <p>请登录您的账户继续访问系统</p>
          </div>

          <div class="login-form">
            <!-- 用户名输入 -->
            <div class="form-group">
              <label>用户名</label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input
                    type="text"
                    v-model="form.uName"
                    placeholder="请输入用户名"
                >
              </div>
            </div>

            <!-- 密码输入 -->
            <div class="form-group">
              <label>密码</label>
              <div class="input-wrapper">
                <span class="input-icon">🔒</span>
                <input
                    type="password"
                    v-model="form.uPassword"
                    placeholder="请输入密码"
                    @keyup.enter="handleLogin"
                >
              </div>
            </div>

<!--            &lt;!&ndash; 记住我 和 忘记密码 &ndash;&gt;-->
<!--            <div class="form-options">-->
<!--              <label class="remember-me">-->
<!--                <input type="checkbox" v-model="rememberMe">-->
<!--                <span>记住我</span>-->
<!--              </label>-->
<!--              <a href="#" class="forgot-password" @click.prevent="forgotPassword">忘记密码？</a>-->
<!--            </div>-->

            <!-- 登录按钮 -->
            <button class="login-btn" @click="handleLogin" :disabled="loading">
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? '登录中...' : '登录' }}
            </button>

            <!-- 注册链接 -->
            <div class="register-section">
              还没有账户？ <a href="#" @click.prevent="goToRegister">立即注册</a>
            </div>

            <!-- 错误提示 -->
            <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 如果已登录，显示主界面 -->
    <MainBord v-else />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { userLoginService } from '@/api/user'
import MainBord from './views/MainBord.vue'
import UserAdd from './views/UserAdd.vue'

// 状态
const isLoggedIn = ref(false)
const showRegister = ref(false)
const loading = ref(false)
const rememberMe = ref(false)
const errorMsg = ref('')

// 表单数据
const form = reactive({
  uName: '',
  uPassword: ''
})

// 处理登录
const handleLogin = async () => {
  // 表单验证
  if (!form.uName || !form.uPassword) {
    errorMsg.value = '用户名和密码不能为空'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    // 调用登录接口
    const res = await userLoginService({
      uName: form.uName,
      uPassword: form.uPassword
    })

    // 根据返回的code判断
    if (res.code === 200) {
      // 登录成功
      if (rememberMe.value) {
        localStorage.setItem('username', form.uName)
      } else {
        sessionStorage.setItem('username', form.uName)
      }

      // 直接切换状态，显示主界面，不弹任何提示
      isLoggedIn.value = true
    } else {
      errorMsg.value = res.message || '登录失败'
    }
  } catch (error) {
    console.error('登录错误:', error)
    errorMsg.value = error.message || '网络错误，请重试'
  } finally {
    loading.value = false
  }
}

// // 忘记密码
// const forgotPassword = () => {
//   alert('请联系管理员重置密码')  // 用 alert 代替 ElMessage
// }

// 跳转到注册页
const goToRegister = () => {
  showRegister.value = true
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

/* 白色卡片 */
.login-card {
  display: flex;
  width: 100%;
  max-width: 1000px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* 左侧区域 */
.login-left {
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
.login-right {
  flex: 1;
  padding: 60px 40px;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: 40px;
}

.form-header h1 {
  font-size: 36px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 600;
}

.form-header p {
  color: #666;
  font-size: 16px;
}

.login-form {
  max-width: 360px;
  margin: 0 auto;
  width: 100%;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-size: 15px;
  font-weight: 500;
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
}

.input-wrapper input {
  width: 100%;
  padding: 14px 14px 14px 45px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
  background: #fafafa;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-wrapper input::placeholder {
  color: #aaa;
  font-size: 14px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.remember-me {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #666;
  font-size: 14px;
}

.remember-me input {
  margin-right: 8px;
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.forgot-password {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.forgot-password:hover {
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.login-btn:disabled {
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

.register-section {
  margin-top: 25px;
  text-align: center;
  color: #666;
  font-size: 15px;
}

.register-section a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  margin-left: 5px;
  cursor: pointer;
}

.register-section a:hover {
  text-decoration: underline;
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

/* 响应式 */
@media (max-width: 768px) {
  .login-card {
    flex-direction: column;
  }

  .login-left {
    padding: 40px 20px;
  }

  .form-header h1 {
    font-size: 30px;
  }
}
</style>