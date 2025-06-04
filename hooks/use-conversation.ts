import { useState } from 'react'
import produce from 'immer'
import { useGetState } from 'ahooks'
import type { ConversationItem } from '@/types/app'
import {
  getConversationsFromSupabase,
  getCurrentConversationIdFromSupabase,
  saveConversationToSupabase,
  saveConversationsToSupabase,
  saveCurrentConversationIdToSupabase,
} from '@/service/conversation-storage'
import { supabase } from '@/utils/supabaseClient'

const storageConversationIdKey = 'conversationIdInfo'
const storageConversationListKey = 'conversationList'

type ConversationInfoType = Omit<ConversationItem, 'inputs' | 'id'>

function useConversation() {
  const [conversationList, setConversationList] = useState<ConversationItem[]>([])
  const [currConversationId, doSetCurrConversationId, getCurrConversationId] = useGetState<string>('-1')

  // 获取当前登录用户
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  // 保存对话列表到Supabase
  const saveConversationListToSupabase = async (appId: string, conversations: ConversationItem[]) => {
    try {
      const user = await getCurrentUser()
      if (user) {
        await saveConversationsToSupabase(user.id, appId, conversations)
        console.log('对话列表已保存到Supabase')
      }
    }
    catch (error) {
      console.error('保存对话列表到Supabase失败:', error)
      // 回退到localStorage
      const validConversations = conversations.filter(conv => conv.id !== '-1')
      globalThis.localStorage?.setItem(`${storageConversationListKey}_${appId}`, JSON.stringify(validConversations))
    }
  }

  // 从Supabase获取对话列表
  const getConversationListFromSupabase = async (appId: string): Promise<ConversationItem[]> => {
    try {
      const user = await getCurrentUser()
      if (user) {
        const conversations = await getConversationsFromSupabase(user.id, appId)
        if (conversations.length > 0) {
          console.log('从Supabase获取到对话列表:', conversations.length, '条')
          return conversations
        }
      }
    }
    catch (error) {
      console.error('从Supabase获取对话列表失败:', error)
    }

    // 回退到localStorage
    const localData = globalThis.localStorage?.getItem(`${storageConversationListKey}_${appId}`)
    const conversations = localData ? JSON.parse(localData) : []
    console.log('从localStorage获取到对话列表:', conversations.length, '条')
    return conversations
  }

  // 保存单个对话到Supabase
  const saveConversationToStorage = async (appId: string, conversation: ConversationItem) => {
    if (conversation.id === '-1')
      return // 不保存新对话占位符

    try {
      const user = await getCurrentUser()
      if (user) {
        await saveConversationToSupabase(user.id, { ...conversation, app_id: appId })
      }
      else {
        // 回退到localStorage
        const conversations = await getConversationListFromSupabase(appId)
        const updatedConversations = conversations.filter(conv => conv.id !== conversation.id)
        updatedConversations.unshift(conversation)
        globalThis.localStorage?.setItem(`${storageConversationListKey}_${appId}`, JSON.stringify(updatedConversations))
      }
    }
    catch (error) {
      console.error('保存对话失败，回退到localStorage:', error)
      // 回退到localStorage
      const conversations = await getConversationListFromSupabase(appId)
      const updatedConversations = conversations.filter(conv => conv.id !== conversation.id)
      updatedConversations.unshift(conversation)
      globalThis.localStorage?.setItem(`${storageConversationListKey}_${appId}`, JSON.stringify(updatedConversations))
    }
  }

  // when set conversation id, we do not have set appId
  const setCurrConversationId = async (id: string, appId: string, isSetToLocalStroge = true, newConversationName = '') => {
    doSetCurrConversationId(id)
    if (isSetToLocalStroge && id !== '-1') {
      try {
        // 首先尝试保存当前对话ID到Supabase
        const user = await getCurrentUser()
        if (user) {
          await saveCurrentConversationIdToSupabase(user.id, appId, id)
        }
        else {
          // 如果用户未登录，仍然使用localStorage作为后备
          const conversationIdInfo = globalThis.localStorage?.getItem(storageConversationIdKey) ? JSON.parse(globalThis.localStorage?.getItem(storageConversationIdKey) || '') : {}
          conversationIdInfo[appId] = id
          globalThis.localStorage?.setItem(storageConversationIdKey, JSON.stringify(conversationIdInfo))
        }
      }
      catch (error) {
        console.error('保存当前对话ID失败，回退到localStorage:', error)
        // 出错时回退到localStorage
        const conversationIdInfo = globalThis.localStorage?.getItem(storageConversationIdKey) ? JSON.parse(globalThis.localStorage?.getItem(storageConversationIdKey) || '') : {}
        conversationIdInfo[appId] = id
        globalThis.localStorage?.setItem(storageConversationIdKey, JSON.stringify(conversationIdInfo))
      }
    }
  }

  const getConversationIdFromStorage = async (appId: string) => {
    try {
      // 首先尝试从Supabase获取当前对话ID
      const user = await getCurrentUser()
      if (user) {
        const id = await getCurrentConversationIdFromSupabase(user.id, appId)
        if (id) {
          console.log('从Supabase获取到当前对话ID:', id)
          return id
        }
      }
    }
    catch (error) {
      console.error('从Supabase获取当前对话ID失败:', error)
    }

    // 如果Supabase获取失败或用户未登录，回退到localStorage
    const conversationIdInfo = globalThis.localStorage?.getItem(storageConversationIdKey) ? JSON.parse(globalThis.localStorage?.getItem(storageConversationIdKey) || '') : {}
    const id = conversationIdInfo[appId]
    console.log('从localStorage获取到当前对话ID:', id)
    return id
  }

  // 同步localStorage数据到Supabase（用于用户首次登录时）
  const syncLocalStorageToSupabase = async (appId: string) => {
    try {
      const user = await getCurrentUser()
      if (!user)
        return

      // 同步当前对话ID
      const localIdData = globalThis.localStorage?.getItem(storageConversationIdKey) ? JSON.parse(globalThis.localStorage?.getItem(storageConversationIdKey) || '') : {}
      if (localIdData[appId])
        await saveCurrentConversationIdToSupabase(user.id, appId, localIdData[appId])

      // 同步对话列表
      const localListData = globalThis.localStorage?.getItem(`${storageConversationListKey}_${appId}`)
      if (localListData) {
        const conversations = JSON.parse(localListData)
        if (conversations.length > 0) {
          await saveConversationsToSupabase(user.id, appId, conversations)
          console.log('已将', conversations.length, '条对话同步到Supabase')
        }
      }

      // 可选：清除localStorage中的数据
      // globalThis.localStorage?.removeItem(storageConversationIdKey)
      // globalThis.localStorage?.removeItem(storageConversationListKey + '_' + appId)
    }
    catch (error) {
      console.error('同步localStorage到Supabase失败:', error)
    }
  }

  // 合并本地和远程对话列表
  const mergeConversationLists = (localList: ConversationItem[], remoteList: ConversationItem[]): ConversationItem[] => {
    const merged = new Map<string, ConversationItem>()

    // 先添加远程数据
    remoteList.forEach((conv) => {
      merged.set(conv.id, conv)
    })

    // 再添加本地数据，如果ID相同，本地数据覆盖远程数据
    localList.forEach((conv) => {
      if (conv.id !== '-1') { // 不处理新对话占位符
        merged.set(conv.id, conv)
      }
    })

    return Array.from(merged.values()).sort((a, b) => {
      // 如果没有created_at字段，使用当前时间戳进行排序
      const aTime = (a as any).created_at ? new Date((a as any).created_at).getTime() : Date.now()
      const bTime = (b as any).created_at ? new Date((b as any).created_at).getTime() : Date.now()
      return bTime - aTime
    })
  }

  const isNewConversation = currConversationId === '-1'
  // input can be updated by user
  const [newConversationInputs, setNewConversationInputs] = useState<Record<string, any> | null>(null)
  const resetNewConversationInputs = () => {
    if (!newConversationInputs)
      return
    setNewConversationInputs(produce(newConversationInputs, (draft) => {
      Object.keys(draft).forEach((key) => {
        draft[key] = ''
      })
    }))
  }
  const [existConversationInputs, setExistConversationInputs] = useState<Record<string, any> | null>(null)
  const currInputs = isNewConversation ? newConversationInputs : existConversationInputs
  const setCurrInputs = isNewConversation ? setNewConversationInputs : setExistConversationInputs

  // info is muted
  const [newConversationInfo, setNewConversationInfo] = useState<ConversationInfoType | null>(null)
  const [existConversationInfo, setExistConversationInfo] = useState<ConversationInfoType | null>(null)
  const currConversationInfo = isNewConversation ? newConversationInfo : existConversationInfo

  return {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    getConversationIdFromStorage,
    saveConversationListToSupabase,
    getConversationListFromSupabase,
    saveConversationToStorage,
    syncLocalStorageToSupabase,
    mergeConversationLists,
    isNewConversation,
    currInputs,
    newConversationInputs,
    existConversationInputs,
    resetNewConversationInputs,
    setCurrInputs,
    currConversationInfo,
    setNewConversationInfo,
    setExistConversationInfo,
  }
}

export default useConversation
