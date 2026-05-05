import request from '@/utils/request'

// 获取所有部门
export function departmentGetAllService() {
    return request.get('/department/findAll')
}

// 根据ID查询部门
export function departmentGetByIdService(deid) {
    return request.get('/department/findById', { params: { deid } })
}

// 新增部门
export function departmentAddService(data) {
    return request.post('/department/insert', data)
}

// 修改部门
export function departmentUpdateService(data) {
    return request.put('/department/update', data)
}

// 删除部门
export function departmentDeleteService(deid) {
    return request.delete('/department/delete', { params: { deid } })
}

// 搜索部门（根据名称）
export function departmentSearchService(keyword) {
    return request.get('/department/search', { params: { keyword } })
}