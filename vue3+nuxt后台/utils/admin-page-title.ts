const adminPageTitles: Record<string, string> = {
  '/dashboard': '工作台',
  '/work-orders': '工单列表',
  '/ai/work-order-draft': '工单草稿助手',
  '/ai/knowledge': '企业文档问答',
  '/accounts': '账号管理',
  '/roles': '角色管理',
  '/permissions': '权限管理',
  '/system': '系统日志'
}

export function getAdminPageTitle(path: string) {
  if (/^\/work-orders\/[^/]+$/.test(path)) {
    return '工单详情'
  }

  return adminPageTitles[path] ?? path
}
