import { supabase } from '@/utils/supabaseClient'
import type { ConversationItem } from '@/types/app'

// 用户对话记录表结构
export type UserConversation = {
    id?: string
    user_id: string
    app_id: string
    conversation_id: string
    conversation_name?: string
    conversation_inputs?: Record<string, any>
    conversation_introduction?: string
    created_at?: string
    updated_at?: string
}

// 用户当前对话表结构
export type UserCurrentConversation = {
    id?: string
    user_id: string
    app_id: string
    current_conversation_id: string
    updated_at?: string
}

/**
 * 保存对话记录到Supabase
 * @param userId 用户ID
 * @param conversation 对话信息
 */
export async function saveConversationToSupabase(
    userId: string,
    conversation: ConversationItem & { app_id: string },
) {
    try {
        const { data, error } = await supabase
            .from('user_conversations')
            .upsert(
                {
                    user_id: userId,
                    app_id: conversation.app_id,
                    conversation_id: conversation.id,
                    conversation_name: conversation.name,
                    conversation_inputs: conversation.inputs,
                    conversation_introduction: conversation.introduction,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id,app_id,conversation_id',
                },
            )
            .select()

        if (error) {
            console.error('保存对话到Supabase失败:', error)
            throw error
        }

        return data
    }
    catch (error) {
        console.error('保存对话到Supabase异常:', error)
        throw error
    }
}

/**
 * 批量保存多个对话到Supabase
 * @param userId 用户ID
 * @param appId 应用ID
 * @param conversations 对话列表
 */
export async function saveConversationsToSupabase(
    userId: string,
    appId: string,
    conversations: ConversationItem[],
) {
    try {
        const conversationData = conversations
            .filter(conv => conv.id !== '-1') // 过滤掉新对话占位符
            .map(conv => ({
                user_id: userId,
                app_id: appId,
                conversation_id: conv.id,
                conversation_name: conv.name,
                conversation_inputs: conv.inputs,
                conversation_introduction: conv.introduction,
                updated_at: new Date().toISOString(),
            }))

        if (conversationData.length === 0)
            return []

        const { data, error } = await supabase
            .from('user_conversations')
            .upsert(conversationData, {
                onConflict: 'user_id,app_id,conversation_id',
            })
            .select()

        if (error) {
            console.error('批量保存对话到Supabase失败:', error)
            throw error
        }

        return data
    }
    catch (error) {
        console.error('批量保存对话到Supabase异常:', error)
        throw error
    }
}

/**
 * 从Supabase获取用户的所有对话
 * @param userId 用户ID
 * @param appId 应用ID
 */
export async function getConversationsFromSupabase(
    userId: string,
    appId: string,
): Promise<ConversationItem[]> {
    try {
        const { data, error } = await supabase
            .from('user_conversations')
            .select('*')
            .eq('user_id', userId)
            .eq('app_id', appId)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('从Supabase获取对话列表失败:', error)
            throw error
        }

        // 转换为ConversationItem格式
        return data?.map(item => ({
            id: item.conversation_id,
            name: item.conversation_name || '',
            inputs: item.conversation_inputs || {},
            introduction: item.conversation_introduction || '',
        })) || []
    }
    catch (error) {
        console.error('从Supabase获取对话列表异常:', error)
        return []
    }
}

/**
 * 保存当前对话ID到Supabase
 * @param userId 用户ID
 * @param appId 应用ID
 * @param conversationId 对话ID
 */
export async function saveCurrentConversationIdToSupabase(
    userId: string,
    appId: string,
    conversationId: string,
) {
    try {
        const { data, error } = await supabase
            .from('user_current_conversation')
            .upsert(
                {
                    user_id: userId,
                    app_id: appId,
                    current_conversation_id: conversationId,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id,app_id',
                },
            )
            .select()

        if (error) {
            console.error('保存当前对话ID到Supabase失败:', error)
            throw error
        }

        return data
    }
    catch (error) {
        console.error('保存当前对话ID到Supabase异常:', error)
        throw error
    }
}

/**
 * 从Supabase获取用户的当前对话ID
 * @param userId 用户ID
 * @param appId 应用ID
 */
export async function getCurrentConversationIdFromSupabase(
    userId: string,
    appId: string,
): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('user_current_conversation')
            .select('current_conversation_id')
            .eq('user_id', userId)
            .eq('app_id', appId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') { // No rows found
                return null
            }
            console.error('从Supabase获取当前对话ID失败:', error)
            throw error
        }

        return data?.current_conversation_id || null
    }
    catch (error) {
        console.error('从Supabase获取当前对话ID异常:', error)
        return null
    }
}

/**
 * 删除对话记录
 * @param userId 用户ID
 * @param appId 应用ID
 * @param conversationId 对话ID
 */
export async function deleteConversationFromSupabase(
    userId: string,
    appId: string,
    conversationId: string,
) {
    try {
        const { error } = await supabase
            .from('user_conversations')
            .delete()
            .eq('user_id', userId)
            .eq('app_id', appId)
            .eq('conversation_id', conversationId)

        if (error) {
            console.error('从Supabase删除对话失败:', error)
            throw error
        }
    }
    catch (error) {
        console.error('从Supabase删除对话异常:', error)
        throw error
    }
}

/**
 * 删除用户在指定应用下的所有数据
 * @param userId 用户ID
 * @param appId 应用ID
 */
export async function deleteAllUserDataFromSupabase(
    userId: string,
    appId: string,
) {
    try {
        // 删除所有对话记录
        const { error: conversationsError } = await supabase
            .from('user_conversations')
            .delete()
            .eq('user_id', userId)
            .eq('app_id', appId)

        if (conversationsError) {
            console.error('删除用户对话记录失败:', conversationsError)
            throw conversationsError
        }

        // 删除当前对话记录
        const { error: currentError } = await supabase
            .from('user_current_conversation')
            .delete()
            .eq('user_id', userId)
            .eq('app_id', appId)

        if (currentError) {
            console.error('删除用户当前对话记录失败:', currentError)
            throw currentError
        }
    }
    catch (error) {
        console.error('删除用户所有数据异常:', error)
        throw error
    }
}

// 保持向后兼容的函数名
export const saveConversationIdToSupabase = saveCurrentConversationIdToSupabase
export const getConversationIdFromSupabase = getCurrentConversationIdFromSupabase
export const getAllConversationInfoFromSupabase = async (userId: string) => {
    // 这个函数需要重新实现，因为现在的数据结构不同了
    console.warn('getAllConversationInfoFromSupabase已废弃，请使用新的API')
    return {}
}
