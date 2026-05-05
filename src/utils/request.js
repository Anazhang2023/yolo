// 导入axios（需要先执行 npm install axios）
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 定义一个变量，记录公共的前缀 baseURL
const instance = axios.create({
    baseURL: '',  // 改成空字符串
    // baseURL: '/api'  // 如果你在代理里配了 /api 就用这个
})


// 添加响应拦截器
instance.interceptors.response.use(
    result => {
        // 直接返回数据部分
        return result.data
    },
    err => {
        // 处理错误，显示后端返回的具体错误信息
        if (err.response) {
            // 后端返回了错误信息
            const errorMsg = err.response.data?.message || err.response.data?.msg || '请求失败'
            ElMessage.error(errorMsg)
            console.error('错误详情:', err.response.data)
        } else if (err.request) {
            // 请求发送了但没有收到响应
            ElMessage.error('网络错误，服务器无响应')
        } else {
            // 请求配置出错
            ElMessage.error('请求配置错误')
        }

        return Promise.reject(err) // 异步的状态转化成失败的状态
    }
)

export default instance

