<template>
  <div class="monitor-container">
    <!-- 左侧上传区域 -->
    <div class="upload-section">
      <div class="upload-header">
        <h3>图片/视频上传</h3>
        <span class="mode-tag">YOLO检测</span>
      </div>

      <!-- 上传按钮组 -->
      <div class="upload-buttons">
        <input
            type="file"
            ref="imageInput"
            accept="image/*"
            style="display: none"
            @change="handleImageSelect"
        >
        <button class="upload-btn image-btn" @click="selectImage">
          <span class="btn-icon">📷</span>
          上传图片
        </button>

        <!--        <button class="upload-btn video-btn">-->
        <!--          <span class="btn-icon">🎥</span>-->
        <!--          上传视频-->
        <!--        </button>-->
      </div>

      <!-- 检测结果区域（添加滚动） -->
      <div v-if="detectionResult" class="detection-result scrollable-content">
        <div class="result-header">
          <h4>检测结果</h4>
          <div class="result-actions">
            <button class="action-btn" @click="editDetection">✏️ 修改</button>
            <button class="action-btn primary" @click="confirmDetection">✅ 确认</button>
          </div>
        </div>

        <!-- 统计卡片（核心修复：增加空值保护） -->
        <div class="stats-cards">
          <div class="stats-card">
            <span class="stats-label">已戴头盔</span>
            <span class="stats-value success">{{ detectionResult?.stats?.hardhat || 0 }}</span>
          </div>
          <div class="stats-card">
            <span class="stats-label">未戴头盔</span>
            <span class="stats-value warning">{{ detectionResult?.stats?.no_hardhat || 0 }}</span>
          </div>
          <div class="stats-card">
            <span class="stats-label">戴口罩</span>
            <span class="stats-value success">{{ detectionResult?.stats?.mask || 0 }}</span>
          </div>
          <div class="stats-card">
            <span class="stats-label">未戴口罩</span>
            <span class="stats-value warning">{{ detectionResult?.stats?.no_mask || 0 }}</span>
          </div>
          <div class="stats-card">
            <span class="stats-label">穿防护服</span>
            <span class="stats-value success">{{ detectionResult?.stats?.vest || 0 }}</span>
          </div>
          <div class="stats-card">
            <span class="stats-label">未穿防护服</span>
            <span class="stats-value warning">{{ detectionResult?.stats?.no_vest || 0 }}</span>
          </div>
          <div class="stats-card">
            <span class="stats-label">总人数</span>
            <span class="stats-value">{{ detectionResult?.stats?.person || 0 }}</span>
          </div>
        </div>

        <!-- 可编辑的违规记录 -->
        <div v-if="isEditing" class="edit-panel">
          <h4>编辑违规记录</h4>
          <div class="edit-list">
            <!-- 固定3个违规类型，下拉框写死且不可修改 -->
            <div class="edit-item">
              <select disabled class="edit-select">
                <option value="no_hardhat">未戴头盔</option>
              </select>
              <input type="number" v-model="editRecords[0].count" min="0">
            </div>
            <div class="edit-item">
              <select disabled class="edit-select">
                <option value="no_mask">未戴口罩</option>
              </select>
              <input type="number" v-model="editRecords[1].count" min="0">
            </div>
            <div class="edit-item">
              <select disabled class="edit-select">
                <option value="no_vest">未穿防护服</option>
              </select>
              <input type="number" v-model="editRecords[2].count" min="0">
            </div>
          </div>
          <div class="edit-actions">
            <button class="btn-cancel" @click="cancelEdit">取消</button>
            <button class="btn-save" @click="saveEdit">保存修改</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧预览区域（上下布局） -->
    <div class="preview-section">
      <div class="preview-header">
        <div class="camera-info">
          <span class="camera-name">{{ currentImageName || 'A区施工区域监控' }}</span>
          <span class="camera-location">{{ currentImagePath || 'A区主施工区域' }}</span>
        </div>
        <div class="preview-status">
          <span class="status-dot" :class="detectionResult ? 'online' : 'offline'"></span>
          <span class="status-text">{{ detectionResult ? '检测完成' : '等待上传' }}</span>
        </div>
      </div>

      <!-- 上下排列的预览容器（添加滚动） -->
      <div class="preview-stack scrollable-preview">
        <!-- 原始图片预览 -->
        <div class="preview-card">
          <div class="preview-card-header">
            <span>原始图片</span>
          </div>
          <div class="media-preview">
            <img
                v-if="previewUrl"
                :src="previewUrl"
                class="preview-image"
            >
            <div v-else class="placeholder">
              <span class="placeholder-icon">📁</span>
              <p>请上传图片进行检测</p>
            </div>
          </div>
        </div>

        <!-- 检测结果图片预览 -->
        <div class="preview-card">
          <div class="preview-card-header">
            <span>检测结果图片</span>
          </div>
          <div class="media-preview">
            <img
                v-if="detectionResult && resultImageUrl"
                :src="resultImageUrl"
                class="preview-image"
                @error="handleImageError"
            >
            <div v-else class="placeholder">
              <span class="placeholder-icon">🔍</span>
              <p>{{ detectionResult ? '检测结果图片加载中...' : '暂无检测结果' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
// 导入你提供的单条插入接口
import { recordAddService } from '@/api/record'

// 文件上传相关
const imageInput = ref(null)
const previewUrl = ref('') // 原始图片预览地址
const resultImageUrl = ref('') // 检测结果图片预览地址
const currentImageName = ref('')
const currentImagePath = ref('')
const selectedFile = ref(null)

// 检测结果（初始化为 null，避免 undefined）
const detectionResult = ref(null)
const isEditing = ref(false)
const editRecords = ref([])

// 选择图片
const selectImage = () => {
  imageInput.value.click()
}

// 处理图片选择
const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  selectedFile.value = file
  currentImageName.value = file.name
  previewUrl.value = URL.createObjectURL(file)
  resultImageUrl.value = '' // 清空之前的检测结果图

  // 模拟本地路径（实际可能需要后端处理）
  const mockPath = `D:\\app\\safety\\source_files\\source_files\\${file.name}`
  currentImagePath.value = mockPath

  // 上传检测
  uploadAndDetect(file, mockPath)
}

// 上传并检测（核心修复：使用后端代理地址）
const uploadAndDetect = async (file, imagePath) => {
  try {
    // 使用 /yolo 代理调用 Flask 接口
    const response = await axios.post('/yolo/detect_image', {
      image_path: imagePath
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data.success) {
      // 确保 detectionResult 有默认值
      detectionResult.value = response.data || { stats: {} }

      // 核心修复：通过后端代理访问图片，解决本地路径无法访问问题
      if (response.data.result_image_path) {
        // 替换为你的 SpringBoot 后端提供的图片访问接口
        const encodedPath = encodeURIComponent(response.data.result_image_path)
        resultImageUrl.value = `/image/result-image?path=${encodedPath}`
        console.log('检测结果图片URL:', resultImageUrl.value)
      }

      // 初始化编辑记录（固定3个违规类型）
      initEditRecords()
    } else {
      alert('检测失败：' + (response.data.error || '未知错误'))
    }
  } catch (error) {
    console.error('检测错误:', error)
    alert('检测失败，请检查Flask服务是否启动')
  }
}

// 图片加载错误处理
const handleImageError = () => {
  console.error('检测结果图片加载失败，请检查后端 /api/result-image 接口是否正常')
  alert('检测结果图片加载失败，请检查后端接口')
}

// 初始化编辑记录（固定生成3个违规类型，增加空值保护）
const initEditRecords = () => {
  if (!detectionResult.value?.stats) return

  // 固定初始化3个违规类型，确保编辑面板始终显示这3项
  editRecords.value = [
    { type: 'no_hardhat', count: detectionResult.value.stats.no_hardhat || 0 },
    { type: 'no_mask', count: detectionResult.value.stats.no_mask || 0 },
    { type: 'no_vest', count: detectionResult.value.stats.no_vest || 0 }
  ]
}

// 编辑检测结果
const editDetection = () => {
  if (!detectionResult.value?.stats) {
    alert('暂无检测结果，无法编辑！')
    return
  }
  isEditing.value = true
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  initEditRecords() // 恢复原值
}

// 保存编辑（同步更新统计卡片数值，增加空值保护）
const saveEdit = () => {
  if (!detectionResult.value?.stats) {
    alert('暂无检测结果，无法保存！')
    return
  }

  // 1. 获取编辑后的违规数值
  const noHardhatVal = parseInt(editRecords.value[0].count) || 0
  const noMaskVal = parseInt(editRecords.value[1].count) || 0
  const noVestVal = parseInt(editRecords.value[2].count) || 0

  // 2. 更新违规数值（统计卡片自动同步）
  detectionResult.value.stats.no_hardhat = noHardhatVal
  detectionResult.value.stats.no_mask = noMaskVal
  detectionResult.value.stats.no_vest = noVestVal

  // 3. 自动计算已合规数值（总人数 - 违规数）
  const totalPerson = detectionResult.value.stats.person || 0
  detectionResult.value.stats.hardhat = totalPerson - noHardhatVal
  detectionResult.value.stats.mask = totalPerson - noMaskVal
  detectionResult.value.stats.vest = totalPerson - noVestVal

  // 4. 退出编辑状态
  isEditing.value = false
  alert('违规数值修改成功，统计卡片已同步更新！')
}

// 【核心修复】单条插入违规记录（完全参考你的 handleSubmit 逻辑）
const insertSingleRecord = async (violationType, violationTypeId, count, imagePath) => {
  // 用于统计当前类型的成功数
  let currentSuccess = 0

  for (let i = 0; i < count; i++) {
    try {
      const recordData = {
        personnelId: null,
        violationTypeId: violationTypeId,
        violationTypeName: violationType,
        imagePath: imagePath,
        status: 0
      }

      // 调用接口
      const res = await recordAddService(recordData)

      // 【关键修复】参考你的逻辑，判断纯字符串或 code
      if (res === '插入成功' || res === '新增成功' || (res && res.code === 200)) {
        currentSuccess++
      } else {
        console.error(`第${i+1}条${violationType}失败:`, res)
      }
    } catch (error) {
      console.error(`第${i+1}条${violationType}网络错误:`, error)
    }
  }

  // 返回当前类型的成功数量
  return currentSuccess
}

// 确认检测结果（重新计算成功/失败数，增加空值保护）
const confirmDetection = async () => {
  if (!detectionResult.value?.stats) {
    alert('暂无检测结果，请先上传图片检测！')
    return
  }

  const stats = detectionResult.value.stats
  const imagePath = detectionResult.value.result_image_path || currentImagePath.value

  let totalSuccess = 0
  let totalCount = 0
  const log = []

  // 1. 处理未戴头盔
  if (stats.no_hardhat > 0) {
    totalCount += stats.no_hardhat
    const success = await insertSingleRecord('未戴头盔', 1, stats.no_hardhat, imagePath)
    totalSuccess += success
    log.push(`未戴头盔：成功 ${success}/${stats.no_hardhat}`)
  }

  // 2. 处理未戴口罩
  if (stats.no_mask > 0) {
    totalCount += stats.no_mask
    const success = await insertSingleRecord('未戴口罩', 2, stats.no_mask, imagePath)
    totalSuccess += success
    log.push(`未戴口罩：成功 ${success}/${stats.no_mask}`)
  }

  // 3. 处理未穿防护服
  if (stats.no_vest > 0) {
    totalCount += stats.no_vest
    const success = await insertSingleRecord('未穿防护服', 3, stats.no_vest, imagePath)
    totalSuccess += success
    log.push(`未穿防护服：成功 ${success}/${stats.no_vest}`)
  }

  // 最终提示
  if (totalCount === 0) {
    alert('本次检测无违规记录，无需保存！')
  } else if (totalSuccess === totalCount) {
    alert(`✅ 全部插入成功！
共 ${totalSuccess} 条记录
${log.join('\n')}`)
  } else {
    alert(`⚠️ 部分插入失败！
成功：${totalSuccess} 条 | 失败：${totalCount - totalSuccess} 条
${log.join('\n')}`)
  }
}
</script>

<style scoped>
/* 编辑面板样式 */
.edit-panel {
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.edit-panel h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.edit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.edit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.edit-select {
  flex: 2;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  background: #e9e9e9;
  cursor: not-allowed;
}

.edit-input {
  flex: 1;
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
}

.edit-input:focus {
  outline: none;
  border-color: #1890ff;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

.btn-cancel {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 13px;
}

.btn-cancel:hover {
  background: #f5f5f5;
}

.btn-save {
  padding: 6px 16px;
  border: 1px solid #1890ff;
  border-radius: 4px;
  background: #1890ff;
  color: white;
  cursor: pointer;
  font-size: 13px;
}

.btn-save:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

/* 核心新增：滚动样式 */
.scrollable-content {
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  padding-right: 8px;
}

.scrollable-preview {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  padding-right: 8px;
}

/* 自定义滚动条样式 - 更美观的滑轨 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 基础样式 */
.monitor-container {
  display: flex;
  height: 100vh;
  background: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.upload-section {
  width: 320px;
  background: white;
  border-right: 1px solid #e8e8e8;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  /* 移除原有overflow，改为在内部容器控制 */
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.mode-tag {
  background: #e6f7ff;
  color: #1890ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.upload-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #d9d9d9;
  background: white;
  width: 100%;
}

.upload-btn.image-btn {
  color: #1890ff;
  border-color: #1890ff;
  background: white;
}

.upload-btn.video-btn {
  color: #52c41a;
  border-color: #52c41a;
  background: white;
}

.btn-icon {
  font-size: 18px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn.primary {
  color: white;
  background: #1890ff;
  border-color: #1890ff;
}

/* 统计卡片样式 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stats-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stats-label {
  font-size: 14px;
  color: #666;
}

.stats-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.stats-value.success {
  color: #52c41a;
}

.stats-value.warning {
  color: #faad14;
}

/* 右侧预览区域 */
.preview-section {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.camera-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.camera-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.camera-location {
  font-size: 12px;
  color: #999;
}

.preview-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #52c41a;
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
}

.status-dot.offline {
  background: #ff4d4f;
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
}

.status-text {
  font-size: 12px;
  color: #666;
}

/* 核心修改：改为上下排列的预览容器 */
.preview-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.preview-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  flex: 1;
  min-height: 250px; /* 确保最小高度 */
}

.preview-card-header {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e8e8e8;
}

.preview-card-header span {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.media-preview {
  flex: 1;
  background: #1a1a1a;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  gap: 16px;
}

.placeholder-icon {
  font-size: 48px;
  opacity: 0.5;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .monitor-container {
    flex-direction: column;
    height: auto;
  }

  .upload-section {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e8e8e8;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  /* 响应式调整滚动高度 */
  .scrollable-content {
    max-height: 400px;
  }

  .scrollable-preview {
    max-height: 500px;
  }
}
</style>