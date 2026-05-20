import request from '@/utils/request'

// 登录
export function userLoginService(data) {
    return request.post('/user/login', data)
}

// 注册
export function userRegisterService(data) {
    return request.post('/user/register', data)
}