const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
    transpileDependencies: true,
    devServer: {
        port: 8081,
        host: '0.0.0.0',  // 允许局域网访问
        open: false,      // 启动时不自动打开浏览器
        proxy: {
            // Java 后端代理
            '^/(user|personnel|department|record|type|image)': {
                target: 'http://localhost:8080',
                changeOrigin: true
            },
            // YOLO 检测接口代理（核心修改）
            '^/yolo': {
                target: 'http://127.0.0.1:5000',  // 改用 127.0.0.1 而非 localhost
                changeOrigin: true,               // 必须开启，解决跨域
                timeout: 60000,                   // 延长超时时间（检测耗时久）
                ws: false,                        // 关闭 websocket
                secure: false                     // 允许非 HTTPS
            }
        }
    }
})