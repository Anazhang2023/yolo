import request from '@/utils/request'

// 获取所有工作人员
export function personnelGetAllService() {
    return request.get('/personnel/findAll')
}

// 根据ID查询工作人员
export function personnelGetByIdService(pid) {
    return request.get('/personnel/findById', { params: { pid } })
}

// 根据部门查询工作人员
export function personnelGetByDeptService(deptId) {
    return request.get('/personnel/findByDepartment', { params: { deptId } })
}

// 新增工作人员
export function personnelAddService(data) {
    return request.post('/personnel/insert', data)
}

// 修改工作人员
export function personnelUpdateService(data) {
    return request.put('/personnel/update', data)
}

// 删除工作人员
export function personnelDeleteService(pid) {
    return request.delete('/personnel/delete', { params: { pid } })
}

// 增加违规次数
export function personnelAddViolationService(pid) {
    return request.put('/personnel/addViolation', null, { params: { pid } })
}

// 处理违规（减少待处理次数）
export function personnelHandleViolationService(pid) {
    return request.put('/personnel/handleViolation', null, { params: { pid } })
}

// 搜索工作人员（根据姓名/部门）
export function personnelSearchService(conditions) {
    return request.get('/personnel/search', { params: conditions })
}


export function personnelPageService(params) {
    return request({
        url: '/personnel/page',
        method: 'POST',
        data: {
            pageNum: params.pageNum || 1,
            pageSize: params.pageSize || 10,
            keyword: params.keyword || ''
        }
    })
}