
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyConversation, notifyUser } = require('../services/socketService');
const { authenticate } = require('../middleware/auth');

// 确保聊天文件上传目录存在
const baseUploadDir = path.join(__dirname, '../../../Front_End/public/uploads/chats');
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// 配置 Multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { conversationId } = req.params;
    const conversationDir = path.join(baseUploadDir, conversationId.toString());
    if (!fs.existsSync(conversationDir)) {
      fs.mkdirSync(conversationDir, { recursive: true });
    }
    cb(null, conversationDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    cb(null, `chat_${timestamp}_${random}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制 10MB
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件（JPEG, JPG, PNG, GIF, WEBP）'));
    }
  }
});

// Apply authentication middleware to all message routes
router.use(authenticate);

// 获取对话列表 - 优化：只返回对话元数据，不包含详细消息，实现真正的按需加载
router.get('/conversations/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.query; // 添加 role 参数：'recruiter' 或 'candidate'

  // 将userId转换为数字类型，避免PostgreSQL无法确定参数数据类型
  const userIdNum = parseInt(userId);

  // 根据 role 参数决定查询逻辑
  let subQuery;

  if (role === 'recruiter') {
    // 招聘者：只查询用户作为招聘者的对话
    subQuery = `
      SELECT c.id
      FROM conversations c
      JOIN recruiters r ON c.recruiter_id = r.id
      WHERE r.user_id = $1 AND c.recruiter_deleted_at IS NULL AND c.deleted_at IS NULL
    `;
  } else if (role === 'candidate') {
    // 候选人：只查询用户作为候选人的对话
    subQuery = `
      SELECT c.id
      FROM conversations c
      JOIN candidates cd ON c.candidate_id = cd.id
      WHERE cd.user_id = $1 AND c.candidate_deleted_at IS NULL AND c.deleted_at IS NULL
    `;
  } else {
    // 兼容旧版本：查询用户作为候选人或招聘者的所有对话
    subQuery = `
      SELECT c.id
      FROM conversations c
      JOIN candidates cd ON c.candidate_id = cd.id
      WHERE cd.user_id = $1 AND c.candidate_deleted_at IS NULL AND c.deleted_at IS NULL
      UNION ALL
      SELECT c.id
      FROM conversations c
      JOIN recruiters r ON c.recruiter_id = r.id
      WHERE r.user_id = $1 AND c.recruiter_deleted_at IS NULL AND c.deleted_at IS NULL
    `;
  }

  // 查询用户参与的所有未被软删除的对话，使用LEFT JOIN确保即使关联记录缺失，对话也能显示
  const result = await query(`
      SELECT 
        c.id,
        c.job_id AS "jobId",
        c.candidate_id AS "candidateId",
        c.recruiter_id AS "recruiterId",
        COALESCE(c.last_message, '暂无消息') AS "lastMessage",
        c.last_time AS "lastTime",
        COALESCE(c.unread_count, 0) AS "unreadCount",
        COALESCE(c.is_active, true) AS "isActive",
        COALESCE(c.total_messages, 0) AS "totalMessages",
        COALESCE(c.candidate_unread, 0) AS "candidateUnread",
        COALESCE(c.recruiter_unread, 0) AS "recruiterUnread",
        COALESCE(c.recruiter_pinned, false) AS "recruiterPinned",
        COALESCE(c.recruiter_hidden, false) AS "recruiterHidden",
        COALESCE(c.candidate_pinned, false) AS "candidatePinned",
        COALESCE(c.candidate_hidden, false) AS "candidateHidden",
        COALESCE(c.status, 'active') AS status,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        COALESCE(j.title, '未知职位') AS job_title,
        COALESCE(co.name, '未知公司') AS company_name,
        COALESCE(u1.name, '未知候选人') AS candidate_name,
        COALESCE(u1.avatar, '') AS candidate_avatar,
        COALESCE(u1.id, cd.user_id) AS "candidateUserId",
        COALESCE(cd.experience, '经验未知') AS candidate_experience,
        COALESCE(cd.city, '地点未知') AS candidate_location,
        COALESCE(u2.name, '未知招聘者') AS recruiter_name,
        COALESCE(u2.avatar, '') AS recruiter_avatar,
        COALESCE(u2.id, r.user_id) AS "recruiterUserId",
        COALESCE(app.id, 0) AS "applicationId"
      FROM (
        ${subQuery}
      ) AS sub
      JOIN conversations c ON sub.id = c.id
      -- 改进JOIN顺序，先JOIN较小的表
      LEFT JOIN recruiters r ON c.recruiter_id = r.id
      LEFT JOIN candidates cd ON c.candidate_id = cd.id
      LEFT JOIN users u1 ON cd.user_id = u1.id
      LEFT JOIN users u2 ON r.user_id = u2.id
      LEFT JOIN jobs j ON c.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.id
      LEFT JOIN applications app ON c.job_id = app.job_id AND c.candidate_id = app.candidate_id
      WHERE 
        (CASE WHEN $2 = 'recruiter' THEN (c.recruiter_hidden IS FALSE OR c.recruiter_hidden IS NULL) ELSE TRUE END) AND
        (CASE WHEN $2 = 'candidate' THEN (c.candidate_hidden IS FALSE OR c.candidate_hidden IS NULL) ELSE TRUE END)
      ORDER BY 
        (CASE WHEN $2 = 'recruiter' THEN c.recruiter_pinned ELSE c.candidate_pinned END) DESC,
        c.updated_at DESC
      LIMIT 100
    `, [userIdNum, role], 15000);

  const conversations = result.rows;

  // 直接返回对话列表，不包含详细消息，实现真正的按需加载
  // 详细消息通过单独的API请求获取
  res.json({
    status: 'success',
    data: conversations,
    count: conversations.length,
    role: role || 'all' // 返回使用的角色参数
  });
}));

// 获取单个对话的消息
router.get('/conversations/:conversationId/messages', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { limit = 20, offset = 0, sort = 'desc' } = req.query; // 默认改为 desc，获取最新消息

  // 转换参数类型，确保与数据库字段类型匹配
  const conversationIdNum = parseInt(conversationId);
  const limitNum = parseInt(limit);
  const offsetNum = parseInt(offset);

  // 查询对话的所有未删除消息，支持分页和排序
  // 默认按时间降序，配合 limit/offset 获取最新消息
  const orderBy = sort === 'asc' ? 'ASC' : 'DESC';
  const result = await query(`
      SELECT 
        m.*,
        u.name AS sender_name,
        u.avatar AS sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1 AND m.is_deleted = false
      ORDER BY m.time ${orderBy}, m.id ${orderBy}
      LIMIT $2 OFFSET $3
    `, [conversationIdNum, limitNum, offsetNum], 15000);

  console.log(`[DEBUG] Get Messages for Conv ${conversationIdNum}: Found ${result.rows.length} messages. Limit: ${limitNum}, Offset: ${offsetNum}`);
  if (result.rows.length === 0) {
    // Debug check: do any messages exist?
    const check = await pool.query('SELECT count(*) FROM messages WHERE conversation_id = $1', [conversationIdNum]);
    console.log(`[DEBUG] Raw message count in DB for Conv ${conversationIdNum}: ${check.rows[0].count}`);
  }

  // 查询总消息数
  const countResult = await query(`
      SELECT COUNT(*) AS total 
      FROM messages m 
      WHERE m.conversation_id = $1 AND m.is_deleted = false
    `, [conversationIdNum], 15000);

  res.json({
    status: 'success',
    data: result.rows,
    count: result.rows.length,
    total: parseInt(countResult.rows[0].total),
    currentLimit: limitNum,
    currentOffset: offsetNum,
    sort: orderBy.toLowerCase()
  });
}));

// 创建或获取对话，并发送第一条消息
router.post('/conversations', async (req, res) => {
  try {
    const { jobId, candidateId, recruiterId, message, senderId } = req.body;

    // 检查必填字段
    if (!jobId || !candidateId || !recruiterId || !message) {
      return res.status(400).json({
        status: 'error',
        message: '职位ID、候选人ID、招聘者ID和消息内容是必填字段'
      });
    }

    // 注意：前端传递的candidateId是users表的id，需要转换为candidates表的id
    // 但recruiterId可能是recruiters表的id，也可能是users表的id（由后面逻辑处理）

    console.log('[DEBUG] Input candidateId (User ID):', candidateId, typeof candidateId);
    console.log('[DEBUG] Input recruiterId:', recruiterId, typeof recruiterId);
    console.log('[DEBUG] Input senderId:', senderId);

    // First, verify the candidate User ID exists in users table
    const candidateUserCheck = await query(
      'SELECT id FROM users WHERE id = $1',
      [parseInt(candidateId)]
    );

    if (candidateUserCheck.rows.length === 0) {
      console.log('[DEBUG] Candidate User ID not found in users table:', candidateId);
      return res.status(404).json({
        status: 'error',
        message: '候选人用户不存在'
      });
    }

    // 获取候选人ID（candidates表中的id）
    const candidateResult = await query(
      'SELECT id, user_id FROM candidates WHERE user_id = $1',
      [parseInt(candidateId)]
    );

    if (candidateResult.rows.length === 0) {
      console.log('[DEBUG] No candidate record found for user_id:', candidateId);
      return res.status(404).json({
        status: 'error',
        message: '候选人不存在'
      });
    }

    const actualCandidateId = candidateResult.rows[0].id;
    const actualCandidateUserId = candidateResult.rows[0].user_id;

    console.log('[DEBUG] Resolved actualCandidateId (Candidate Table ID):', actualCandidateId);
    console.log('[DEBUG] Resolved actualCandidateUserId (User ID):', actualCandidateUserId);

    // Resolve Recruiter ID:
    // Frontend might pass User ID as 'recruiterId'. We need 'recruiters.id'.
    // Try to find by ID first, then by User ID.
    let actualRecruiterId = recruiterId;
    const recIdInt = parseInt(recruiterId);

    console.log(`[DEBUG] Resolving Recruiter ID for: ${recruiterId} (Int: ${recIdInt})`);

    const recruiterCheck = await query(
      'SELECT id, user_id FROM recruiters WHERE id = $1',
      [recIdInt]
    );

    let recruiterUserId;

    if (recruiterCheck.rows.length > 0) {
      actualRecruiterId = recruiterCheck.rows[0].id;
      recruiterUserId = recruiterCheck.rows[0].user_id;
      console.log(`[DEBUG] Found by Recruiter ID: ${actualRecruiterId}, UserID: ${recruiterUserId}`);
    } else {
      // Try searching by user_id
      const recruiterByUser = await query(
        'SELECT id, user_id FROM recruiters WHERE user_id = $1',
        [recIdInt]
      );
      if (recruiterByUser.rows.length > 0) {
        actualRecruiterId = recruiterByUser.rows[0].id;
        recruiterUserId = recruiterByUser.rows[0].user_id;
        console.log(`[DEBUG] Found by User ID. Actual Recruiter ID: ${actualRecruiterId}, UserID: ${recruiterUserId}`);
      } else {
        console.log(`[DEBUG] Recruiter NOT FOUND for ID: ${recruiterId}`);
        return res.status(404).json({
          status: 'error',
          message: '招聘者不存在'
        });
      }
    }

    // 确定发送者和接收者
    // 如果指定了 senderId，则使用它；否则默认候选人为发送者
    let finalSenderId, finalReceiverId;
    if (senderId) {
      finalSenderId = parseInt(senderId);
      // 如果发送者是候选人，则接收者是招聘者，反之亦然
      // 注意：使用字符串比较防止类型差异导致的判断错误
      if (finalSenderId.toString() === actualCandidateUserId.toString()) {
        finalReceiverId = recruiterUserId;
      } else {
        finalReceiverId = actualCandidateUserId;
      }
    } else {
      // 默认逻辑：候选人发起对话
      finalSenderId = actualCandidateUserId;
      finalReceiverId = recruiterUserId;
    }

    // 检查对话是否已经存在
    const existingConversation = await pool.query(`
      SELECT id FROM conversations 
      WHERE candidate_id = $1 AND recruiter_id = $2
    `, [actualCandidateId, actualRecruiterId]);

    let conversationId;
    let isNewConversation = false;

    if (existingConversation.rows.length > 0) {
      // 使用现有对话
      conversationId = existingConversation.rows[0].id;
    } else {
      // 创建新对话
      isNewConversation = true;
      const newConversation = await pool.query(`
        INSERT INTO conversations (
          job_id, candidate_id, recruiter_id, last_message,
          last_time, unread_count, total_messages, recruiter_unread, candidate_unread
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 0, 0, 0, 0)
        RETURNING id
      `, [jobId, actualCandidateId, actualRecruiterId, message]);

      conversationId = newConversation.rows[0].id;
    }

    console.log('[DEBUG] Preparing to INSERT message:');
    console.log('[DEBUG] conversationId:', conversationId);
    console.log('[DEBUG] sender_id:', finalSenderId);
    console.log('[DEBUG] receiver_id:', finalReceiverId);

    // 1. 插入消息
    const newMessage = await query(`
      INSERT INTO messages (
        conversation_id, sender_id, receiver_id, text, type, status, time, is_deleted
      ) VALUES ($1, $2, $3, $4, 'text', 'sent', CURRENT_TIMESTAMP, false)
      RETURNING *
    `, [conversationId, finalSenderId, finalReceiverId, message]);

    // 2. 更新对话元数据
    // 确定要增加谁的未读计数：接收者那一侧增加
    const unreadField = (finalReceiverId === recruiterUserId) ? 'recruiter_unread' : 'candidate_unread';

    await pool.query(`
      UPDATE conversations 
      SET 
        last_message = $1,
        last_time = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        total_messages = total_messages + 1,
        ${unreadField} = ${unreadField} + 1,
        -- 确保对话不再被隐藏
        recruiter_hidden = false,
        candidate_hidden = false
      WHERE id = $2
    `, [message, conversationId]);

    // 3. 发送实时通知
    // 需要获取发送者的姓名和头像，以便前端即时显示
    const senderInfo = await query(`
      SELECT name, avatar FROM users WHERE id = $1
    `, [finalSenderId]);

    const messageData = {
      ...newMessage.rows[0],
      sender_name: senderInfo.rows[0]?.name || '用户',
      sender_avatar: senderInfo.rows[0]?.avatar || ''
    };

    // 广播到对话房间和接收者
    if (typeof notifyConversation === 'function') {
      notifyConversation(conversationId, 'new_message', messageData);
    }
    if (typeof notifyUser === 'function') {
      notifyUser(finalReceiverId, 'new_message', {
        ...messageData,
        conversation_id: conversationId
      });
    }

    res.json({
      status: 'success',
      data: {
        conversationId,
        message: messageData
      },
      message: '消息发送成功'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 发送消息
router.post('/', async (req, res) => {
  try {
    const { conversationId, senderId, receiverId, text, type = 'text' } = req.body;

    // 检查必填字段
    if (!conversationId || !senderId || !text) {
      return res.status(400).json({
        status: 'error',
        message: '对话ID、发送者ID和消息内容是必填字段'
      });
    }

    // 添加日志，便于调试
    console.log('发送消息请求:', {
      conversationId,
      senderId,
      receiverId,
      text,
      type
    });

    // 获取对话详情，用于确认发送者身份和头像信息
    // 关键修复：直接关联 users 表获取最新的头像和名称，因为 recruiters/candidates 表中的副本可能不是最新的
    const conversation = await pool.query(`
      SELECT c.*, 
        u_can.name as candidate_name, u_can.avatar as candidate_avatar, can.user_id as candidate_user_id,
        u_rec.name as recruiter_name, u_rec.avatar as recruiter_avatar, r.user_id as recruiter_user_id,
        j.title as job_title,
        comp.name as company_name, comp.logo as company_logo
      FROM conversations c
      LEFT JOIN candidates can ON c.candidate_id = can.id
      LEFT JOIN users u_can ON can.user_id = u_can.id
      LEFT JOIN jobs j ON c.job_id = j.id
      LEFT JOIN companies comp ON j.company_id = comp.id
      JOIN recruiters r ON c.recruiter_id = r.id
      LEFT JOIN users u_rec ON r.user_id = u_rec.id
      WHERE c.id = $1
    `, [conversationId]);

    if (conversation.rows.length === 0) {
      console.error('发送消息失败: 对话不存在', { conversationId });
      return res.status(404).json({ status: 'error', message: '对话不存在' });
    }

    const { candidate_user_id, recruiter_user_id, candidate_id, recruiter_id, candidate_name, candidate_avatar, recruiter_name, recruiter_avatar } = conversation.rows[0];

    console.log('对话关联用户ID:', {
      candidate_user_id,
      recruiter_user_id,
      candidate_id,
      recruiter_id
    });

    if (!candidate_user_id || !recruiter_user_id) {
      console.error('[DEBUG] CRITICAL: Missing user_id for candidate or recruiter in conversation!', { conversationId });
    }

    // 使用严格比较，并确保类型一致
    const senderIdNum = parseInt(senderId);
    // user_id 可能是字符串或数字，统一转换
    const candidateUserIdNum = parseInt(candidate_user_id);
    const recruiterUserIdNum = parseInt(recruiter_user_id);

    // 如果未提供receiverId，自动确定接收者：如果发送者是候选人，则接收者是招聘者，反之亦然
    let actualReceiverId;
    if (receiverId && receiverId !== undefined && receiverId !== null && receiverId !== '') {
      actualReceiverId = receiverId;
    } else {
      // 严格比较：如果发送者是候选人，则接收者是招聘者，反之亦然
      actualReceiverId = senderIdNum === candidateUserIdNum ? recruiterUserIdNum : candidateUserIdNum;
    }

    // 重要修复：根据实际对话表中的ID来确定接收者，而不是用户ID
    // 获取对话中对应的接收者ID
    let actualReceiverConversationId;
    if (senderIdNum === candidateUserIdNum) {
      // 发送者是候选人，接收者是招聘者
      actualReceiverConversationId = recruiter_id;
    } else {
      // 发送者是招聘者，接收者是候选人
      actualReceiverConversationId = candidate_id;
    }

    console.log('确定的接收者ID:', actualReceiverId, '实际对话中的接收者ID:', actualReceiverConversationId);

    // 发送消息
    const newMessage = await pool.query(`
      INSERT INTO messages (
        conversation_id, sender_id, receiver_id, text, type, status, time, is_deleted, quoted_message
      ) VALUES ($1, $2, $3, $4, $5, 'sent', CURRENT_TIMESTAMP, false, $6)
      RETURNING *
    `, [conversationId, senderId, actualReceiverId, text, type, req.body.quoted_message || null]);

    // 确定要更新的未读字段：如果发送者是候选人，则招聘者有未读消息，反之亦然
    const unreadField = senderIdNum === candidateUserIdNum ? 'recruiter_unread' : 'candidate_unread';

    await pool.query(`
      UPDATE conversations 
      SET 
        last_message = $1,
        last_time = CURRENT_TIMESTAMP,
        total_messages = total_messages + 1,
        updated_at = CURRENT_TIMESTAMP,
        ${unreadField} = ${unreadField} + 1,
        -- 关键修复：发送新消息时，自动解除双方的隐藏/删除状态，确保消息可见
        recruiter_hidden = false,
        candidate_hidden = false,
        recruiter_deleted_at = NULL,
        candidate_deleted_at = NULL
      WHERE id = $2
    `, [text, conversationId]);

    // 即使双方都在线，也广播消息，让前端通过socket实时接收
    // 1. 广播到对话房间 (用于活跃聊天窗口)
    const messageData = {
      ...newMessage.rows[0],
      sender_name: senderIdNum === candidateUserIdNum ? (conversation.rows[0].candidate_name || '求职者') : (conversation.rows[0].recruiter_name || '招聘者'),
      sender_avatar: senderIdNum === candidateUserIdNum ? (conversation.rows[0].candidate_avatar || '') : (conversation.rows[0].recruiter_avatar || '')
    };

    notifyConversation(conversationId, 'new_message', messageData);

    // 2. 广播到接收者的个人房间 (用于消息列表更新和通知)
    // 这样当用户在列表页而没有进入具体对话时，也能收到更新
    console.log(`Sending explicit notification to user ${actualReceiverId} via socket`);
    notifyUser(actualReceiverId, 'new_message', {
      ...messageData,
      conversation_id: conversationId // 确保包含conversation_id方便前端匹配
    });

    res.json({
      status: 'success',
      data: newMessage.rows[0],
      message: '消息发送成功'
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 在标记消息为已读路由中，修复ID映射逻辑
router.put('/read/:conversationId/:userId', async (req, res) => {
  try {
    const { conversationId, userId } = req.params;

    // 首先获取对话信息，确定用户在对话中的角色
    const conversation = await pool.query(`
      SELECT 
        cd.user_id AS candidate_user_id,
        r.user_id AS recruiter_user_id
      FROM conversations c
      JOIN candidates cd ON c.candidate_id = cd.id
      JOIN recruiters r ON c.recruiter_id = r.id
      WHERE c.id = $1
    `, [conversationId]);

    if (conversation.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '对话不存在' });
    }

    const { candidate_user_id, recruiter_user_id } = conversation.rows[0];
    const userIdNum = parseInt(userId);

    // 根据用户ID确定要更新的未读字段
    let updateField;
    if (userIdNum === parseInt(candidate_user_id)) {
      updateField = 'candidate_unread';
    } else if (userIdNum === parseInt(recruiter_user_id)) {
      updateField = 'recruiter_unread';
    } else {
      return res.status(404).json({ status: 'error', message: '用户不在该对话中' });
    }

    // 更新对话的未读计数
    const updatedConversationRes = await pool.query(`
      UPDATE conversations 
      SET ${updateField} = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, candidate_unread, recruiter_unread, updated_at
    `, [conversationId]);

    // 更新消息的状态为已读
    const updatedMessagesRes = await pool.query(`
      UPDATE messages 
      SET status = 'read'
      WHERE conversation_id = $1 AND receiver_id = $2 AND status != 'read'
      RETURNING *
    `, [conversationId, userIdNum]);

    const updatedMessages = updatedMessagesRes.rows || [];
    for (const msg of updatedMessages) {
      notifyConversation(conversationId, 'message_updated', msg);
      if (msg.sender_id) notifyUser(msg.sender_id, 'message_updated', msg);
      if (msg.receiver_id) notifyUser(msg.receiver_id, 'message_updated', msg);
    }

    const updatedConversation = updatedConversationRes.rows?.[0];
    if (updatedConversation) {
      if (candidate_user_id) notifyUser(candidate_user_id, 'conversation_updated', updatedConversation);
      if (recruiter_user_id) notifyUser(recruiter_user_id, 'conversation_updated', updatedConversation);
      notifyConversation(conversationId, 'conversation_updated', updatedConversation);
    }

    res.json({
      status: 'success',
      message: '消息已标记为已读'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 标记所有消息为已读
router.put('/read-all', asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  if (!userId || !role) {
    return res.status(400).json({ status: 'error', message: '缺少用户ID或角色参数' });
  }

  const userIdNum = parseInt(userId);
  let updateConversationSql = '';

  // 1. 更新对话表中的未读计数
  if (role === 'recruiter') {
    // 招聘者：更新 recruiter_unread
    // 需要连接 recruiters 表来确认 recruiter_id
    updateConversationSql = `
      UPDATE conversations c
      SET recruiter_unread = 0, updated_at = CURRENT_TIMESTAMP
      FROM recruiters r
      WHERE c.recruiter_id = r.id AND r.user_id = $1 AND c.recruiter_unread > 0
    `;
  } else if (role === 'candidate') {
    // 候选人：更新 candidate_unread
    // 需要连接 candidates 表来确认 candidate_id
    updateConversationSql = `
      UPDATE conversations c
      SET candidate_unread = 0, updated_at = CURRENT_TIMESTAMP
      FROM candidates cd
      WHERE c.candidate_id = cd.id AND cd.user_id = $1 AND c.candidate_unread > 0
    `;
  } else {
    return res.status(400).json({ status: 'error', message: '无效的角色' });
  }

  await pool.query(updateConversationSql, [userIdNum]);

  // 2. 更新消息表中的状态
  // 将所有接收者为当前用户的未读消息标记为已读
  await pool.query(`
    UPDATE messages 
    SET status = 'read'
    WHERE receiver_id = $1 AND status != 'read'
  `, [userIdNum]);

  res.json({
    status: 'success',
    message: '所有消息已标记为已读'
  });
}));

// 获取单个对话详情
router.get('/conversation/:conversationId', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { limit = 20, offset = 0, sort = 'desc' } = req.query;

  // 转换参数类型，确保与数据库字段类型匹配
  const conversationIdNum = parseInt(conversationId);
  const limitNum = parseInt(limit);
  const offsetNum = parseInt(offset);

  // 查询对话详情，只返回未被软删除的对话
  // 使用LEFT JOIN替代JOIN，确保即使关联表没有匹配记录也能返回对话
  // 优化：改进JOIN顺序，先JOIN较小的表
  const conversationResult = await query(`
      SELECT 
        c.*,
        COALESCE(j.title, '未知职位') AS job_title,
        COALESCE(co.name, '未知公司') AS company_name,
        COALESCE(u1.name, '未知候选人') AS candidate_name,
        COALESCE(u1.avatar, '') AS candidate_avatar,
        COALESCE(u1.id, 0) AS candidateId,
        COALESCE(u2.name, '未知招聘者') AS recruiter_name,
        COALESCE(u2.avatar, '') AS recruiter_avatar,
        COALESCE(u2.id, 0) AS recruiterId,
        COALESCE(app.id, 0) AS "applicationId"
      FROM conversations c
      -- 改进JOIN顺序，先JOIN较小的表
      LEFT JOIN recruiters r ON c.recruiter_id = r.id
      LEFT JOIN candidates cd ON c.candidate_id = cd.id
      LEFT JOIN users u1 ON cd.user_id = u1.id
      LEFT JOIN users u2 ON r.user_id = u2.id
      LEFT JOIN jobs j ON c.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.id
      LEFT JOIN applications app ON c.job_id = app.job_id AND c.candidate_id = app.candidate_id
      WHERE c.id = $1 AND c.deleted_at IS NULL
    `, [conversationIdNum], 15000);

  if (conversationResult.rows.length === 0) {
    const error = new Error('对话不存在');
    error.statusCode = 404;
    error.errorCode = 'CONVERSATION_NOT_FOUND';
    throw error;
  }

  // 查询对话的未删除消息，支持分页和排序
  // 优化：添加索引友好的ORDER BY
  const orderBy = sort === 'asc' ? 'ASC' : 'DESC';
  const messagesResult = await query(`
      SELECT 
        m.*,
        u.name AS sender_name,
        u.avatar AS sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1 AND m.is_deleted = false
      ORDER BY m.time ${orderBy}, m.id ${orderBy}
      LIMIT $2 OFFSET $3
    `, [conversationIdNum, limitNum, offsetNum], 15000);

  // 查询总消息数
  const countResult = await query(`
      SELECT COUNT(*) AS total 
      FROM messages m 
      WHERE m.conversation_id = $1 AND m.is_deleted = false
    `, [conversationIdNum], 15000);

  res.json({
    status: 'success',
    data: {
      conversation: conversationResult.rows[0],
      messages: messagesResult.rows,
      total: parseInt(countResult.rows[0].total)
    }
  });
}));

// 删除单条消息（软删除）
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    // 检查消息是否存在并获取对话ID
    const messageResult = await pool.query(
      'SELECT id, conversation_id FROM messages WHERE id = $1 AND is_deleted = false',
      [messageId]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '消息不存在或已被删除'
      });
    }

    const conversationId = messageResult.rows[0].conversation_id;

    // 软删除消息：更新is_deleted字段为true，记录删除时间和删除者
    await pool.query(
      'UPDATE messages SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE id = $2',
      [req.body.deletedBy || null, messageId]
    );

    // 重新计算对话的最后一条消息并同步到对话表
    const latestMessageResult = await pool.query(`
      SELECT text, time 
      FROM messages 
      WHERE conversation_id = $1 AND is_deleted = false 
      ORDER BY time DESC, id DESC 
      LIMIT 1
    `, [conversationId]);

    if (latestMessageResult.rows.length > 0) {
      const { text, time } = latestMessageResult.rows[0];
      await pool.query(`
        UPDATE conversations 
        SET last_message = $1, last_time = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $3
      `, [text, time, conversationId]);
    } else {
      // 如果没有更多消息了，重置最后一条消息
      await pool.query(`
        UPDATE conversations 
        SET last_message = '暂无消息', last_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [conversationId]);
    }

    res.json({
      status: 'success',
      message: '消息已成功隐藏'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 删除对话（软删除）
// 删除对话（软删除）
router.delete('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    // 获取发起删除的用户ID（从请求体中获取）
    const { deletedBy } = req.body;

    if (!deletedBy) {
      return res.status(400).json({
        status: 'error',
        message: '缺少删除者ID信息'
      });
    }

    const deletedByInt = parseInt(deletedBy);

    // 首先获取对话关联的用户信息
    const conversationResult = await pool.query(`
      SELECT 
        c.*, 
        cd.user_id as candidate_user_id,
        r.user_id as recruiter_user_id
      FROM conversations c
      LEFT JOIN candidates cd ON c.candidate_id = cd.id
      LEFT JOIN recruiters r ON c.recruiter_id = r.id
      WHERE c.id = $1
    `, [conversationId]);

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '对话不存在'
      });
    }

    const conversation = conversationResult.rows[0];
    let updateSql = '';

    // 判断删除者是招聘者还是求职者
    if (parseInt(conversation.recruiter_user_id) === deletedByInt) {
      // 招聘者删除了对话
      updateSql = 'UPDATE conversations SET recruiter_deleted_at = CURRENT_TIMESTAMP WHERE id = $1';
    } else if (parseInt(conversation.candidate_user_id) === deletedByInt) {
      // 求职者删除了对话
      updateSql = 'UPDATE conversations SET candidate_deleted_at = CURRENT_TIMESTAMP WHERE id = $1';
    } else {
      // 如果不是对话的参与者
      return res.status(403).json({
        status: 'error',
        message: '您无权删除此对话'
      });
    }

    // 执行软删除
    await pool.query(updateSql, [conversationId]);

    // 如果双方都删除了，则彻底标记为非活跃或删除（可选逻辑）
    // 暂时只做单方面不可见

    res.json({
      status: 'success',
      message: '对话已成功隐藏'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 更新对话状态（置顶/隐藏）
router.patch('/conversations/:conversationId/status', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { role, action } = req.body;

  if (!['recruiter', 'candidate'].includes(role)) {
    return res.status(400).json({ status: 'error', message: '无效的角色' });
  }

  if (!['pin', 'unpin', 'hide', 'unhide'].includes(action)) {
    return res.status(400).json({ status: 'error', message: '无效的操作' });
  }

  let updateField;
  let updateValue;

  if (role === 'recruiter') {
    if (action === 'pin') { updateField = 'recruiter_pinned'; updateValue = true; }
    else if (action === 'unpin') { updateField = 'recruiter_pinned'; updateValue = false; }
    else if (action === 'hide') { updateField = 'recruiter_hidden'; updateValue = true; }
    else if (action === 'unhide') { updateField = 'recruiter_hidden'; updateValue = false; }
  } else {
    if (action === 'pin') { updateField = 'candidate_pinned'; updateValue = true; }
    else if (action === 'unpin') { updateField = 'candidate_pinned'; updateValue = false; }
    else if (action === 'hide') { updateField = 'candidate_hidden'; updateValue = true; }
    else if (action === 'unhide') { updateField = 'candidate_hidden'; updateValue = false; }
  }

  await query(`
    UPDATE conversations 
    SET ${updateField} = $1 
    WHERE id = $2
  `, [updateValue, conversationId]);

  res.json({
    status: 'success',
    message: '操作成功',
    data: { [updateField]: updateValue }
  });
}));

// 获取两个用户之间的所有消息记录
router.get('/sender/:senderId/receiver/:receiverId', async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    // 查询sender和receiver之间的所有未删除消息，按时间顺序排序
    const result = await pool.query(`
      SELECT 
        m.*,
        u.name AS sender_name,
        u.avatar AS sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE ((m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1))
        AND m.is_deleted = false
      ORDER BY m.time ASC
    `, [senderId, receiverId]);

    res.json({
      status: 'success',
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 上传聊天图片
router.post('/upload-image/:conversationId', (req, res) => {
  const { conversationId } = req.params;

  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: '未选择文件' });
    }

    try {
      const { senderId, receiverId } = req.body;

      if (!senderId || !receiverId) {
        // 如果失败，尝试删除文件
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ status: 'error', message: 'senderId 和 receiverId 是必填项' });
      }

      const fileUrl = `/uploads/chats/${conversationId}/${req.file.filename}`;
      const fileName = req.file.originalname;
      const fileSize = req.file.size;
      const fileType = req.file.mimetype;

      // 保存消息到数据库
      const result = await pool.query(`
        INSERT INTO messages (
          conversation_id, sender_id, receiver_id, text, type, 
          file_url, file_name, file_size, file_type, 
          status, time, is_deleted, quoted_message
        ) VALUES ($1, $2, $3, $4, 'image', $5, $6, $7, $8, 'sent', CURRENT_TIMESTAMP, false, $9)
        RETURNING *
      `, [conversationId, senderId, receiverId, '[图片]', fileUrl, fileName, fileSize, fileType, req.body.quoted_message ? JSON.parse(req.body.quoted_message) : null]);

      // 更新对话的最后一条消息
      const unreadField = await getUnreadField(conversationId, senderId);

      await pool.query(`
        UPDATE conversations 
        SET 
          last_message = $1,
          last_time = CURRENT_TIMESTAMP,
          total_messages = total_messages + 1,
          updated_at = CURRENT_TIMESTAMP,
          ${unreadField} = ${unreadField} + 1,
          -- 关键修复：发送图片时，自动解除双方的隐藏/删除状态
          recruiter_hidden = false,
          candidate_hidden = false,
          recruiter_deleted_at = NULL,
          candidate_deleted_at = NULL
        WHERE id = $2
      `, ['[图片]', conversationId]);

      // 获取发送者信息用于socket推送
      // 需要知道发送者是候选人还是招聘者，以及对应的名字头像
      const conversationInfo = await pool.query(`
      SELECT
      c.candidate_id, c.recruiter_id,
        u1.name as candidate_name, u1.avatar as candidate_avatar, cd.user_id as candidate_user_id,
        u2.name as recruiter_name, u2.avatar as recruiter_avatar, r.user_id as recruiter_user_id
        FROM conversations c
        LEFT JOIN candidates cd ON c.candidate_id = cd.id
        LEFT JOIN recruiters r ON c.recruiter_id = r.id
        LEFT JOIN users u1 ON cd.user_id = u1.id
        LEFT JOIN users u2 ON r.user_id = u2.id
        WHERE c.id = $1
        `, [conversationId]);

      if (conversationInfo.rows.length > 0) {
        const info = conversationInfo.rows[0];
        const senderIdNum = parseInt(senderId);
        const candidateUserIdNum = parseInt(info.candidate_user_id);

        notifyConversation(conversationId, 'new_message', {
          ...result.rows[0],
          sender_name: senderIdNum === candidateUserIdNum ? (info.candidate_name || '求职者') : (info.recruiter_name || '招聘者'),
          sender_avatar: senderIdNum === candidateUserIdNum ? (info.candidate_avatar || '') : (info.recruiter_avatar || '')
        });
      }

      res.json({
        status: 'success',
        data: result.rows[0],
        message: '图片发送成功'
      });
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ status: 'error', message: error.message });
    }
  });
});

// 辅助函数：获取应该更新的未读字段
async function getUnreadField(conversationId, senderId) {
  const conversation = await pool.query(`
    SELECT cd.user_id AS candidate_user_id
    FROM conversations c
    JOIN candidates cd ON c.candidate_id = cd.id
    WHERE c.id = $1
        `, [conversationId]);

  if (conversation.rows.length === 0) return 'recruiter_unread'; // 默认

  const { candidate_user_id } = conversation.rows[0];
  return senderId === candidate_user_id ? 'recruiter_unread' : 'candidate_unread';
}

// 配置通用的文件存储（支持简历等文件）
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { conversationId } = req.params;
    const conversationDir = path.join(baseUploadDir, conversationId.toString());
    if (!fs.existsSync(conversationDir)) {
      fs.mkdirSync(conversationDir, { recursive: true });
    }
    cb(null, conversationDir);
  },
  filename: (req, file, cb) => {
    // 确保文件名使用正确的 UTF-8 编码
    let originalName = file.originalname;

    // 修复文件名编码问题
    try {
      // 检测并修复 UTF-8 编码
      originalName = Buffer.from(originalName, 'binary').toString('utf-8');
    } catch (e) {
      console.warn('文件名编码修复失败:', e);
    }

    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    // 只替换特殊字符，保留中文和常见字符
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s\-_]/g, '_');
    cb(null, `${baseName}_${timestamp}_${random}${ext}`);
  }
});

const fileUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 20 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];
    const extname = /\.(pdf|doc|docx|xls|xlsx|png|jpg|jpeg|gif|txt)$/i.test(file.originalname);
    if (allowedTypes.includes(file.mimetype) || extname) {
      return cb(null, true);
    } else {
      cb(new Error('不支持的文件类型，请上传 PDF、Word、Excel、图片等文件'));
    }
  }
});

// 上传聊天文件（支持简历等）
router.post('/upload-file/:conversationId', (req, res) => {
  const { conversationId } = req.params;

  fileUpload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('简历上传 - Multer错误:', err.message);
      return res.status(400).json({ status: 'error', message: err.message });
    }

    if (!req.file) {
      console.error('简历上传 - 没有文件');
      return res.status(400).json({ status: 'error', message: '未选择文件' });
    }

    console.log('简历上传 - 接收到文件:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      conversationId,
      body: req.body
    });

    try {
      const { senderId, receiverId, fileType } = req.body;

      console.log('简历上传 - 参数:', { senderId, receiverId, fileType });

      if (!senderId || !receiverId) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        console.error('简历上传 - 缺少必要参数');
        return res.status(400).json({ status: 'error', message: 'senderId 和 receiverId 是必填项' });
      }

      const fileUrl = `/uploads/chats/${conversationId}/${req.file.filename}`;
      // 修复文件名编码问题 - 将 latin1 转换为 UTF-8
      let fileName = req.file.originalname;
      try {
        fileName = Buffer.from(fileName, 'latin1').toString('utf-8');
        console.log('修复后的文件名:', fileName);
      } catch (e) {
        console.warn('修复文件名编码失败:', e);
      }
      const fileSize = req.file.size;
      const fileTypeVal = req.file.mimetype;

      let messageType = 'file';
      if (fileTypeVal.startsWith('image/')) {
        messageType = 'image';
      }

      let messageText = `[文件] ${fileName}`;
      if (fileType === 'resume') {
        messageText = `[简历] ${fileName}`;
      }

      // 尝试解析 quoted_message
      let quotedMessageObj = null;
      try {
        if (req.body.quoted_message) {
          quotedMessageObj = typeof req.body.quoted_message === 'string'
            ? JSON.parse(req.body.quoted_message)
            : req.body.quoted_message;
        }
      } catch (e) {
        console.warn('解析 quoted_message 失败:', e);
      }

      console.log('简历上传 - 准备插入数据库:', { conversationId, senderId, receiverId, messageText, messageType, fileUrl, fileName, fileSize, fileTypeVal, quotedMessageObj });

      const result = await pool.query(`
        INSERT INTO messages (
          conversation_id, sender_id, receiver_id, text, type, 
          file_url, file_name, file_size, file_type, 
          status, time, is_deleted, quoted_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'sent', CURRENT_TIMESTAMP, false, $10)
        RETURNING *
      `, [conversationId, senderId, receiverId, messageText, messageType, fileUrl, fileName, fileSize, fileTypeVal, quotedMessageObj]);

      console.log('简历上传 - 数据库插入成功:', result.rows[0].id);

      const unreadField = await getUnreadField(conversationId, senderId);

      await pool.query(`
        UPDATE conversations 
        SET 
          last_message = $1,
          last_time = CURRENT_TIMESTAMP,
          total_messages = total_messages + 1,
          updated_at = CURRENT_TIMESTAMP,
          ${unreadField} = ${unreadField} + 1,
          recruiter_hidden = false,
          candidate_hidden = false,
          recruiter_deleted_at = NULL,
          candidate_deleted_at = NULL
        WHERE id = $2
      `, [messageText, conversationId]);

      const conversationInfo = await pool.query(`
        SELECT
          c.candidate_id, c.recruiter_id,
          u1.name as candidate_name, u1.avatar as candidate_avatar, cd.user_id as candidate_user_id,
          u2.name as recruiter_name, u2.avatar as recruiter_avatar, r.user_id as recruiter_user_id
        FROM conversations c
        LEFT JOIN candidates cd ON c.candidate_id = cd.id
        LEFT JOIN recruiters r ON c.recruiter_id = r.id
        LEFT JOIN users u1 ON cd.user_id = u1.id
        LEFT JOIN users u2 ON r.user_id = u2.id
        WHERE c.id = $1
      `, [conversationId]);

      if (conversationInfo.rows.length > 0) {
        const info = conversationInfo.rows[0];
        const senderIdNum = parseInt(senderId);
        const candidateUserIdNum = parseInt(info.candidate_user_id);

        notifyConversation(conversationId, 'new_message', {
          ...result.rows[0],
          sender_name: senderIdNum === candidateUserIdNum ? (info.candidate_name || '求职者') : (info.recruiter_name || '招聘者'),
          sender_avatar: senderIdNum === candidateUserIdNum ? (info.candidate_avatar || '') : (info.recruiter_avatar || '')
        });
      }

      res.json({
        status: 'success',
        data: result.rows[0],
        message: '文件发送成功'
      });
    } catch (error) {
      console.error('简历上传 - 错误:', error.message);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ status: 'error', message: error.message });
    }
  });
});

// Update WeChat exchange status
router.put('/exchange/:messageId', asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { action, userId } = req.body; // userId helps verify identity

  // Get message
  const msgResult = await pool.query('SELECT * FROM messages WHERE id = $1', [messageId]);
  if (msgResult.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
  const msg = msgResult.rows[0];

  // Verify permission: User must be a participant of the conversation and NOT the sender
  // This is more robust than checking msg.receiver_id which might be inconsistent in legacy data
  const msgSenderId = msg.sender_id.toString();
  const requestUserId = userId ? userId.toString() : '';

  // 1. Check if user is the sender (Senders cannot accept their own request)
  if (msgSenderId === requestUserId) {
    return res.status(403).json({
      error: 'Unauthorized operation',
      message: 'You cannot accept your own request'
    });
  }

  // 2. Check if user is a participant of the conversation
  const convResult = await pool.query(`
    SELECT 
      cd.user_id as candidate_user_id,
      r.user_id as recruiter_user_id
    FROM conversations c
    LEFT JOIN candidates cd ON c.candidate_id = cd.id
    LEFT JOIN recruiters r ON c.recruiter_id = r.id
    WHERE c.id = $1
  `, [msg.conversation_id]);

  if (convResult.rows.length === 0) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const { candidate_user_id, recruiter_user_id } = convResult.rows[0];
  const isParticipant = (candidate_user_id && candidate_user_id.toString() === requestUserId) ||
    (recruiter_user_id && recruiter_user_id.toString() === requestUserId);

  if (!isParticipant) {
    console.log(`[Exchange Debug] Permission Denied. User ${requestUserId} is not in conversation ${msg.conversation_id}`);
    return res.status(403).json({
      error: 'Unauthorized operation',
      message: 'You are not a participant of this conversation'
    });
  }

  // If we are here, the user is a participant and not the sender. 
  // We can safely assume they are the intended receiver.

  if (action === 'accept') {
    // 1. Fetch Initiator's WeChat (Sender)
    const senderRes = await pool.query('SELECT wechat FROM users WHERE id = $1', [msg.sender_id]);
    const initiatorWechat = senderRes.rows[0]?.wechat || '';

    // 2. Fetch Receiver's WeChat (Current User)
    const receiverRes = await pool.query('SELECT wechat FROM users WHERE id = $1', [userId]);
    const receiverWechat = receiverRes.rows[0]?.wechat || '';

    // 3. Update Message to include BOTH
    const newContent = JSON.stringify({
      status: 'accepted',
      initiator_wechat: initiatorWechat,
      receiver_wechat: receiverWechat,
      wechat: initiatorWechat // 保持兼容性，前端Receiver视角的wechat字段
    });

    const updateRes = await pool.query(
      'UPDATE messages SET text = $1 WHERE id = $2 RETURNING *',
      [newContent, messageId]
    );

    // Notify
    notifyConversation(msg.conversation_id, 'message_updated', updateRes.rows[0]);
    if (candidate_user_id) notifyUser(candidate_user_id, 'message_updated', updateRes.rows[0]);
    if (recruiter_user_id) notifyUser(recruiter_user_id, 'message_updated', updateRes.rows[0]);
    return res.json({ status: 'success', data: updateRes.rows[0] });

  } else if (action === 'reject') {
    const newContent = JSON.stringify({ status: 'rejected' });
    const updateRes = await pool.query(
      'UPDATE messages SET text = $1 WHERE id = $2 RETURNING *',
      [newContent, messageId]
    );
    notifyConversation(msg.conversation_id, 'message_updated', updateRes.rows[0]);
    if (candidate_user_id) notifyUser(candidate_user_id, 'message_updated', updateRes.rows[0]);
    if (recruiter_user_id) notifyUser(recruiter_user_id, 'message_updated', updateRes.rows[0]);
    return res.json({ status: 'success', data: updateRes.rows[0] });
  }

  return res.status(400).json({ error: 'Invalid action' });
}));

module.exports = router;
