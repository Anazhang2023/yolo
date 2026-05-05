<template>
  <div class="monitor-container">
    <!-- 左侧操作区 -->
    <div class="upload-section">
      <div class="upload-header">
        <h3>违规记录录入</h3>
        <span class="mode-tag">视频检测</span>
      </div>

      <!-- 上传按钮组 -->
      <div class="upload-buttons">
        <input
            type="file"
            ref="videoInput"
            accept="video/*"
            style="display: none"
            @change="handleVideoSelect"
        >
        <button class="upload-btn video-btn" @click="selectVideo">
          <span class="btn-icon">🎥</span>
          选择视频
        </button>
      </div>

      <!-- 已选文件信息 -->
      <div v-if="currentFileName" class="file-info-card">
        <div class="file-info-item">
          <span class="info-label">已选文件：</span>
          <span class="info-value">{{ currentFileName }}</span>
        </div>
        <div class="file-info-item">
          <span class="info-label">文件路径：</span>
          <span class="info-value">{{ currentFilePath }}</span>
        </div>
      </div>

      <!-- 视频检测信息 -->
      <div v-if="detectionResult" class="video-info-card">
        <div class="video-info-item">
          <span class="info-label">总违规截图：</span>
          <span class="info-value">{{ detectionResult.saved_images?.count || 0 }} 张</span>
        </div>
        <div class="video-info-item">
          <span class="info-label">预览间隔：</span>
          <select v-model="previewInterval" @change="refreshPreviewScreenshots" class="interval-select">
            <option value="1">显示全部截图</option>
            <option value="5">每5张抽取1张</option>
            <option value="10">每10张抽取1张</option>
            <option value="20">每20张抽取1张</option>
            <option value="50">每50张抽取1张</option>
          </select>
        </div>
        <div class="video-info-item">
          <span class="info-label">预览数量：</span>
          <span class="info-value">{{ previewScreenshots.length }} 张</span>
        </div>
      </div>

      <!-- 视频违规截图选择区 -->
      <div v-if="detectionResult && previewScreenshots.length" class="screenshot-select-section">
        <h4>违规截图预览（共{{ detectionResult.saved_images.count }}张，{{ previewInterval == 1 ? '显示全部' : `按间隔${previewInterval}抽取` }}）</h4>
        <div class="screenshot-grid">
          <div
              v-for="(img, index) in previewScreenshots"
              :key="index"
              class="screenshot-item"
              :class="{ selected: selectedScreenshots.includes(img), active: currentPreviewImage === img }"
          >
            <img
                :src="getImageUrl(img)"
                :alt="`违规截图${index+1}`"
                class="screenshot-img"
                @click="handleScreenshotClick(img)"
                @error="handleImageError"
            >
            <span class="screenshot-name">{{ getFileName(img) }}</span>
            <!-- 违规类型选择（选中时显示） -->
            <select
                v-if="selectedScreenshots.includes(img)"
                v-model="selectedViolationTypes[img]"
                class="violation-select"
            >
              <option value="no_hardhat">未戴头盔</option>
              <option value="no_mask">未戴口罩</option>
              <option value="no_vest">未穿防护服</option>
            </select>
          </div>
        </div>
        <!-- 保存选中截图 -->
        <div class="save-selected-bar">
          <span>已选择 {{ selectedScreenshots.length }} 张截图</span>
          <button
              class="save-selected-btn"
              @click="confirmSaveSelected"
              :disabled="selectedScreenshots.length === 0"
          >
            ✅ 确认保存选中截图
          </button>
        </div>
      </div>
    </div>

    <!-- 右侧预览区 -->
    <div class="preview-section">
      <div class="preview-header">
        <div class="camera-info">
          <span class="camera-name">{{ currentFileName || '施工区域监控' }}</span>
          <span class="camera-location">{{ currentFilePath || '未选择文件' }}</span>
        </div>
        <div class="preview-status">
          <span class="status-dot" :class="currentFileName ? 'online' : 'offline'"></span>
          <span class="status-text">{{ getStatusText() }}</span>
        </div>
      </div>

      <div class="preview-stack scrollable-preview">
        <!-- 原始视频预览 -->
        <div class="preview-card">
          <div class="preview-card-header">
            <span>原始视频</span>
          </div>
          <div class="media-preview">
            <video
                v-if="previewUrl"
                :src="previewUrl"
                class="preview-video"
                controls
                preload="metadata"
            ></video>
            <div v-else class="placeholder">
              <span class="placeholder-icon">🎥</span>
              <p>请选择视频文件</p>
            </div>
          </div>
        </div>

        <!-- 选中截图预览 -->
        <div class="preview-card">
          <div class="preview-card-header">
            <span>当前选中违规截图预览</span>
          </div>
          <div class="media-preview">
            <img
                v-if="previewImageUrl"
                :src="previewImageUrl"
                class="preview-image"
                @error="handleImageError"
            >
            <div v-else class="placeholder">
              <span class="placeholder-icon">🔍</span>
              <p>请点击左侧截图进行预览</p>
            </div>
          </div>
          <div class="preview-footer">
            <span>{{ currentPreviewImage ? `当前预览：${getFileName(currentPreviewImage)}` : '暂无选中截图' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
// 导入单条插入接口
import { recordAddService } from '@/api/record'

// ========== 基础变量 ==========
const videoInput = ref(null)
const previewUrl = ref('')
const currentFileName = ref('')
const currentFilePath = ref('')
const detectionResult = ref(null)

// ========== 视频截图核心变量 ==========
const previewInterval = ref(1) // 默认显示全部截图
const previewScreenshots = ref([]) // 存储全部抽取/全部截图
const selectedScreenshots = ref([]) // 选中的截图
const selectedViolationTypes = ref({}) // 每张截图对应的违规类型
const currentPreviewImage = ref('') // 当前在右侧预览的截图

// ========== 计算属性 ==========
// 右侧预览图的URL
const previewImageUrl = computed(() => {
  if (currentPreviewImage.value) {
    return getImageUrl(currentPreviewImage.value)
  }
  // 如果没有选中，默认显示第一张
  return previewScreenshots.value.length > 0
      ? getImageUrl(previewScreenshots.value[0])
      : ''
})

// ========== 核心方法 ==========
// 选择视频
const selectVideo = () => {
  videoInput.value.click()
}

// 处理视频选择
const handleVideoSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  initFileInfo(file)
  // 视频模式：自动检测并抽取截图
  uploadAndDetectVideo(file, currentFilePath.value)
}

// 初始化文件信息
const initFileInfo = (file) => {
  currentFileName.value = file.name
  previewUrl.value = URL.createObjectURL(file)
  currentFilePath.value = `D:\\app\\safety\\source_files\\source_files\\${file.name}`
  // 重置所有状态
  detectionResult.value = null
  previewScreenshots.value = []
  selectedScreenshots.value = []
  selectedViolationTypes.value = {}
  currentPreviewImage.value = ''
}

// 视频检测接口
const uploadAndDetectVideo = async (file, videoPath) => {
  try {
    alert('视频检测中，可能需要较长时间，请耐心等待...')
    const response = await axios.post('/yolo/detect_video', {
      video_path: videoPath
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 300000 // 5分钟超时
    })

    if (response.data.success) {
      detectionResult.value = response.data
      // 抽取预览截图
      extractPreviewScreenshots()
      // 默认预览第一张
      if (previewScreenshots.value.length > 0) {
        currentPreviewImage.value = previewScreenshots.value[0]
      }
      alert(`视频检测完成！共检测到 ${response.data.saved_images?.count || 0} 张违规截图`)
    } else {
      alert('检测失败：' + (response.data.error || '未知错误'))
    }
  } catch (error) {
    console.error('视频检测错误:', error)
    alert(error.code === 'ECONNABORTED' ? '检测超时' : '检测失败，请检查服务')
  }
}

// 按间隔抽取预览截图
const extractPreviewScreenshots = () => {
  if (!detectionResult.value?.saved_images?.images) {
    previewScreenshots.value = []
    console.log('无违规截图数据')
    return
  }

  const allImages = detectionResult.value.saved_images.images
  const interval = parseInt(previewInterval.value)
  const extracted = []

  // 间隔为1时，直接赋值全部截图
  if (interval === 1) {
    previewScreenshots.value = [...allImages]
    console.log(`✅ 显示全部 ${allImages.length} 张违规截图`)
    return
  }

  // 按间隔抽取
  for (let i = 0; i < allImages.length; i += interval) {
    extracted.push(allImages[i])
  }

  previewScreenshots.value = extracted
  console.log(`✅ 按间隔${interval}抽取，共显示 ${extracted.length} 张违规截图`)
}

// 刷新预览截图（切换间隔时）
const refreshPreviewScreenshots = () => {
  extractPreviewScreenshots()
  // 切换间隔后，默认预览第一张
  if (previewScreenshots.value.length > 0) {
    currentPreviewImage.value = previewScreenshots.value[0]
  }
}

// 点击截图：同时处理选中和预览
const handleScreenshotClick = (imgPath) => {
  // 切换选中状态
  const index = selectedScreenshots.value.indexOf(imgPath)
  if (index > -1) {
    selectedScreenshots.value.splice(index, 1)
    delete selectedViolationTypes.value[imgPath]
  } else {
    selectedScreenshots.value.push(imgPath)
    selectedViolationTypes.value[imgPath] = 'no_hardhat' // 默认类型
  }
  // 强制更新右侧预览为当前点击的截图
  currentPreviewImage.value = imgPath
}

// 保存选中的视频截图
const confirmSaveSelected = async () => {
  const typeMap = {
    'no_hardhat': { id: 1, name: '未戴头盔' },
    'no_mask': { id: 2, name: '未戴口罩' },
    'no_vest': { id: 3, name: '未穿防护服' }
  }

  let successCount = 0
  const log = []

  for (const img of selectedScreenshots.value) {
    const type = selectedViolationTypes.value[img]
    const { id, name } = typeMap[type]
    const success = await insertSingleRecord(name, id, 1, img)

    if (success > 0) {
      successCount++
      log.push(`${getFileName(img)} - ${name}：成功`)
    } else {
      log.push(`${getFileName(img)} - ${name}：失败`)
    }
  }

  // 提示结果并重置选择
  alert(successCount === selectedScreenshots.value.length
      ? `✅ 全部保存成功！共${successCount}条`
      : `⚠️ 部分失败！成功${successCount}条，失败${selectedScreenshots.value.length-successCount}条\n${log.join('\n')}`)
  selectedScreenshots.value = []
  selectedViolationTypes.value = {}
}

// 单条插入接口
const insertSingleRecord = async (violationType, violationTypeId, count, imagePath) => {
  let success = 0
  for (let i = 0; i < count; i++) {
    try {
      const res = await recordAddService({
        personnelId: null,
        violationTypeId,
        violationTypeName: violationType,
        imagePath,
        status: 0
      })
      if (res === '插入成功' || res === '新增成功' || (res && res.code === 200)) {
        success++
      }
    } catch (e) {
      console.error(`插入失败：${e.message}`)
    }
  }
  return success
}

// ========== 辅助方法 ==========
const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  const encodedPath = encodeURIComponent(imagePath)
  return `/image/result-image?path=${encodedPath}`
}
const getFileName = (filePath) => {
  return filePath ? (filePath.split('\\').pop() || filePath.split('/').pop()) : ''
}
const getStatusText = () => {
  if (!currentFileName.value) return '未选择文件'
  if (detectionResult.value) {
    return `视频检测完成（违规截图：${detectionResult.value.saved_images?.count || 0}）`
  }
  return '视频检测中...'
}
const handleImageError = (e) => {
  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzgwODA4MCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZmlsbD0iIzYwNjA2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5Zu+54mH5bm/5pyN5Yqh6KOFPC90ZXh0Pjwvc3ZnPg=='
}

// ========== 监听间隔变化 ==========
watch(previewInterval, () => {
  if (detectionResult.value) {
    extractPreviewScreenshots()
  }
})
</script>

<style scoped>
/* 基础样式 */
* { margin: 0; padding: 0; box-sizing: border-box; }
.monitor-container {
  display: flex;
  height: 100vh;
  background: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 全局滚动条样式 - 统一美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb {
  background: #1890ff;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #40a9ff;
}

/* 左侧区域 */
.upload-section {
  width: 450px;
  background: white;
  border-right: 1px solid #e8e8e8;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  max-height: 100vh;
  /* 左侧滚动优化 */
  scrollbar-width: thin;
  scrollbar-color: #1890ff #f0f0f0;
}
.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mode-tag {
  background: #e6f7ff;
  color: #1890ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
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
  border: 1px solid #d9d9d9;
  background: white;
  transition: all 0.2s;
}
.video-btn { color: #52c41a; border-color: #52c41a; }
.upload-btn:hover { opacity: 0.9; transform: translateY(-2px); }

/* 文件信息卡片 */
.file-info-card, .video-info-card {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}
.file-info-item, .video-info-item {
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
  font-size: 13px;
}
.info-label { color: #666; }
.info-value { color: #333; font-weight: 500; }
.interval-select {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
}

/* 截图选择区域 */
.screenshot-select-section {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}
.screenshot-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 12px 0;
  max-height: calc(100vh - 350px); /* 优化高度计算 */
  overflow-y: auto;
  padding-right: 6px;
}
.screenshot-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  border: 2px solid transparent;
}
/* 选中状态（蓝色） */
.screenshot-item.selected {
  border-color: #1890ff;
  background: #e6f7ff;
}
/* 当前预览状态（绿色） */
.screenshot-item.active {
  border-color: #52c41a;
  background: #f6ffed;
}
.screenshot-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}
.screenshot-name {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.violation-select {
  width: 100%;
  padding: 6px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
}
.save-selected-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 4px;
  margin-top: 10px;
}
.save-selected-btn {
  padding: 8px 16px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.save-selected-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

/* 右侧预览区 */
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
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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
.status-dot.online { background: #52c41a; }
.status-dot.offline { background: #ff4d4f; }
.status-text {
  font-size: 12px;
  color: #666;
}

/* 核心新增：右侧预览区滚动 */
.scrollable-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  padding-right: 8px;
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
.media-preview {
  flex: 1;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px; /* 优化最小高度 */
}
.preview-video, .preview-image {
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
/* 预览底部信息 */
.preview-footer {
  padding: 10px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e8e8e8;
  font-size: 13px;
  color: #666;
  text-align: center;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .monitor-container { flex-direction: column; height: auto; }
  .upload-section {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e8e8e8;
    max-height: 500px; /* 移动端限制高度 */
  }
  .screenshot-grid {
    grid-template-columns: repeat(4, 1fr);
    max-height: 300px; /* 移动端截图网格高度 */
  }
  .scrollable-preview {
    max-height: 600px; /* 移动端预览区高度 */
  }
}
</style>