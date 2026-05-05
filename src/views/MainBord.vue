<template>
  <div class="dashboard-wrapper">
    <!-- 左侧导航栏 - 紫色背景 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>人员安全检测系统</h2>
        <p class="subtitle">基于 SpringBoot + YOLO</p>
      </div>

      <div class="project-info">
        <p class="project-title">计算机科学与技术专业</p>
        <p class="project-desc">毕业设计项目</p>
      </div>

      <nav class="sidebar-nav">
        <!-- 菜单点击切换组件 -->
        <a href="#" class="nav-item" :class="{ active: currentView === 'personnel' }" @click.prevent="currentView = 'personnel'">
          <span class="nav-icon">👥</span>
          <span class="nav-text">工作人员管理</span>
        </a>
        <a href="#" class="nav-item" :class="{ active: currentView === 'violation' }" @click.prevent="currentView = 'violation'">
          <span class="nav-icon">⚠️</span>
          <span class="nav-text">违规行为管理</span>
        </a>
        <a href="#" class="nav-item" :class="{ active: currentView === 'datahub-image' }" @click.prevent="currentView = 'datahub-image'">
          <span class="nav-icon">📷</span>
          <span class="nav-text">图片行为检测</span>
        </a>
        <a href="#" class="nav-item" :class="{ active: currentView === 'datahub-video' }" @click.prevent="currentView = 'datahub-video'">
          <span class="nav-icon">🎥</span>
          <span class="nav-text">视频行为检测</span>
        </a>
      </nav>
    </div>

    <!-- 右侧主要内容区 - 根据 currentView 显示不同组件 -->
    <div class="main-content">
      <!-- 工作人员管理 -->
      <div v-if="currentView === 'personnel'" class="view-container">
        <PersonnelFindAll />
      </div>

      <!-- 违规行为管理 -->
      <div v-else-if="currentView === 'violation'" class="view-container">
        <ViolationManage />
      </div>

      <!-- 图片行为检测 -->
      <div v-else-if="currentView === 'datahub-image'" class="view-container">
        <DataHubImage />
      </div>

      <!-- 视频行为检测 -->
      <div v-else-if="currentView === 'datahub-video'" class="view-container">
        <DataHubVideo />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
// 导入各个功能组件
import PersonnelFindAll from './PersonnelFindAll.vue'
import ViolationManage from './ViolationManage.vue'
import DataHubImage from './DataHubImage.vue'  // 图片检测组件
import DataHubVideo from './DataHub.vue'  // 视频检测组件

// 当前显示的视图，默认显示图片检测页面
const currentView = ref('datahub-image')
</script>

<script>
export default {
  name: 'MainBoard'
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.dashboard-wrapper {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

/* ===== 左侧导航栏 - 紫色渐变 ===== */
.sidebar {
  width: 260px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 0 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #fff;
}

.sidebar-header .subtitle {
  font-size: 12px;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.8);
}

.project-info {
  padding: 20px;
  background: rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.project-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.project-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
}

.sidebar-nav {
  flex: 1;
  padding: 0 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 5px;
  transition: all 0.3s;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-weight: 500;
}

.nav-icon {
  margin-right: 12px;
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
}

/* ===== 右侧主要内容 ===== */
.main-content {
  flex: 1;
  padding: 0;  /* 移除默认padding，让子组件占满全屏 */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.view-container {
  width: 100%;
  height: 100vh;  /* 占满整个视口高度 */
  overflow: hidden;  /* 防止子组件溢出 */
}

/* 响应式 */
@media (max-width: 1024px) {
  .sidebar {
    width: 80px;
  }

  .sidebar-header h2,
  .sidebar-header .subtitle,
  .project-info,
  .nav-text {
    display: none;
  }

  .nav-item {
    justify-content: center;
  }

  .nav-icon {
    margin-right: 0;
    font-size: 22px;
  }
}

@media (max-width: 768px) {
  .dashboard-wrapper {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    padding: 15px;
  }

  .sidebar-header h2,
  .sidebar-header .subtitle,
  .project-info {
    display: block;
  }

  .nav-text {
    display: inline-block;
  }

  .nav-item {
    justify-content: flex-start;
  }
}
</style>