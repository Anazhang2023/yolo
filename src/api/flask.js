import axios from 'axios'

// 图片检测
export function detectImage(imagePath) {
    return axios.post('/yolo/detect_image', {
        image_path: imagePath
    })
}

// 视频检测（以后加）
export function detectVideo(videoPath) {
    return axios.post('/yolo/detect_video', {
        video_path: videoPath
    })
}