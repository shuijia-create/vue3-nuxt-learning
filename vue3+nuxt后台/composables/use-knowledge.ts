import { askKnowledgeApi } from '~/utils/api/knowledge'

// 企业知识库模块的前端业务入口。
// 页面只表达“我要问知识库”，具体接口地址和响应解包都收在 API client 里。
export function useKnowledge() {
  function ask(question: string) {
    return askKnowledgeApi(question)
  }

  return {
    ask
  }
}
