import request from '@/utils/request'

// 获取所有违规类型
export function typeGetAllService() {
    return request.get('/type/findAll')
}

// 根据ID查询违规类型
export function typeGetByIdService(vid) {
    return request.get('/type/findById', { params: { vid } })
}

// 根据名称搜索违规类型
export function typeSearchService(name) {
    return request.get('/type/findByName', { params: { name } })
}

// 新增违规类型
export function typeAddService(data) {
    return request.post('/type/insert', data)
}

// 修改违规类型
export function typeUpdateService(data) {
    return request.put('/type/update', data)
}

// 删除违规类型
export function typeDeleteService(vid) {
    return request.delete('/type/delete', { params: { vid } })
}