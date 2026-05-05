import request from '@/utils/request'

// 获取所有用户
export function userGetAllService() {
    return request.get('/user/findAll')
}

// 根据ID查询用户
export function userGetByIdService(uid) {
    return request.get('/user/findById', { params: { uid } })
}

// 根据用户名查询
export function userGetByNameService(uName) {
    return request.get('/user/findByUserName', { params: { uName } })
}

// 新增用户
export function userAddService(data) {
    return request.post('/user/insert', data)
}

// 修改用户
export function userUpdateService(data) {
    return request.put('/user/update', data)
}

// 删除用户
export function userDeleteService(uid) {
    return request.delete('/user/delete', { params: { uid } })
}

// 登录
export function userLoginService(data) {
    return request.post('/user/login', data)
}

// 注册
export function userRegisterService(data) {
    return request.post('/user/register', data)
}