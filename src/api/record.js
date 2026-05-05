import request from '@/utils/request'

// 获取所有检测记录
export function recordGetAllService() {
    return request.get('/record/findAll')
}

// 根据ID查询记录
export function recordGetByIdService(did) {
    return request.get('/record/findById', { params: { did } })
}

// 根据人员ID查询记录
export function recordGetByPersonnelService(pid) {
    return request.get('/record/findByPersonnel', { params: { pid } })
}

// 根据状态查询记录
export function recordGetByStatusService(status) {
    return request.get('/record/findByStatus', { params: { status } })
}

// 获取今日记录
export function recordGetTodayService() {
    return request.get('/record/findToday')
}

// 新增检测记录
export function recordAddService(data) {
    return request.post('/record/insert', data)
}

// 更新记录状态
export function recordUpdateStatusService(did, status) {
    return request.put('/record/updateStatus', null, { params: { did, status } })
}

// 删除记录
export function recordDeleteService(did) {
    return request.delete('/record/delete', { params: { did } })
}

// 获取统计数据
export function recordGetStatsService() {
    return request.get('/record/statistics')
}

// 搜索记录（多条件）
export function recordSearchService(conditions) {
    return request.get('/record/search', { params: conditions })
}

// 完整更新违规记录
export function recordUpdateService(data) {
    return request({
        url: '/record/update',
        method: 'put',
        data: data
    })
}

// 分页查询记录 - 修改版本
export function recordPageService(params) {
    // 构建请求参数，过滤掉空值
    const requestData = {
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 10,
        keyword: params.keyword || ''
    }

    // 只有当 status 有值且不是空字符串时才添加
    if (params.status !== undefined && params.status !== null && params.status !== '') {
        requestData.status = Number(params.status) // 确保是数字类型
    }

    // 只有当 startDate 有值时才添加
    if (params.startDate) {
        requestData.startDate = params.startDate
    }

    // 只有当 endDate 有值时才添加
    if (params.endDate) {
        requestData.endDate = params.endDate
    }

    console.log('分页请求参数:', requestData) // 调试用

    return request({
        url: '/record/page',
        method: 'post',
        data: requestData
    })
}

// 批量添加违规记录
export function recordBatchAddService(data) {
    return request({
        url: '/record/batchAdd',
        method: 'post',
        data: data
    })
}

// 更新记录的人员信息
export function recordUpdatePersonnelService(did, pid) {
    return request({
        url: '/record/updatePersonnel',
        method: 'put',
        params: { did, pid }
    })
}