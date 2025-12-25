// 消息相关路由
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

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

// 获取对话列表 - 优化：只返回对话元数据，不包含详细消息，实现真正的按需加载
router.get('/conversations/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  // 将userId转换为数字类型，避免PostgreSQL无法确定参数数据类型
  const userIdNum = parseInt(userId);

  // 查询用户参与的所有未被软删除的对话，使用LEFT JOIN确保即使关联记录缺失，对话也能显示
  // 优化：添加了15秒超时设置，确保查询不会无限期等待
  // 优化：同一招聘者和候选人只返回一个对话，按更新时间降序
  // 优化：改进JOIN顺序，先JOIN较小的表
  // 优化：使用子查询优化OR条件，提高索引使用率
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
        COALESCE(c.status, 'active') AS status,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        COALESCE(j.title, '未知职位') AS job_title,
        COALESCE(co.name, '未知公司') AS company_name,
        COALESCE(u1.name, '未知候选人') AS candidate_name,
        COALESCE(u1.avatar, '') AS candidate_avatar,
        COALESCE(cd.experience, '经验未知') AS candidate_experience,
        COALESCE(cd.city, '地点未知') AS candidate_location,
        COALESCE(u2.name, '未知招聘者') AS recruiter_name,
        COALESCE(u2.avatar, '') AS recruiter_avatar,
        COALESCE(u2.id, r.user_id) AS "recruiterUserId"
      FROM (
        -- 先获取候选对话ID，使用UNION ALL优化OR条件，提高索引使用率
        SELECT c.id
        FROM conversations c
        JOIN candidates cd ON c.candidate_id = cd.id
        WHERE cd.user_id = $1 AND c.candidate_deleted_at IS NULL AND c.deleted_at IS NULL
        UNION ALL
        SELECT c.id
        FROM conversations c
        JOIN recruiters r ON c.recruiter_id = r.id
        WHERE r.user_id = $1 AND c.recruiter_deleted_at IS NULL AND c.deleted_at IS NULL
      ) AS sub
      JOIN conversations c ON sub.id = c.id
      -- 改进JOIN顺序，先JOIN较小的表
      LEFT JOIN recruiters r ON c.recruiter_id = r.id
      LEFT JOIN candidates cd ON c.candidate_id = cd.id
      LEFT JOIN users u1 ON cd.user_id = u1.id
      LEFT JOIN users u2 ON r.user_id = u2.id
      LEFT JOIN jobs j ON c.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.id
      ORDER BY c.updated_at DESC
      LIMIT 100
    `, [userIdNum], 15000);

  const conversations = result.rows;

  // 直接返回对话列表，不包含详细消息，实现真正的按需加载
  // 详细消息通过单独的API请求获取
  res.json({
    status: 'success',
    data: conversations,
    count: conversations.length
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
    const { jobId, candidateId, recruiterId, message } = req.body;

    // 检查必填字段
    if (!jobId || !candidateId || !recruiterId || !message) {
      return res.status(400).json({
        status: 'error',
        message: '职位ID、候选人ID、招聘者ID和消息内容是必填字段'
      });
    }

    // 注意：前端传递的candidateId是users表的id，需要转换为candidates表的id
    // 但recruiterId已经是recruiters表的id，直接使用即可

    // 获取候选人ID（candidates表中的id）
    const candidateResult = await pool.query(
      'SELECT id FROM candidates WHERE user_id = $1',
      [candidateId]
    );

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '候选人不存在'
      });
    }

    const actualCandidateId = candidateResult.rows[0].id;
    const actualRecruiterId = recruiterId;

    // 检查对话是否已经存在 - 移除job_id检查，同一招聘者和候选人之间只允许一个对话
    const existingConversation = await pool.query(`
      SELECT id FROM conversations 
      WHERE candidate_id = $1 AND recruiter_id = $2
    `, [actualCandidateId, actualRecruiterId]);

    let conversationId;

    if (existingConversation.rows.length > 0) {
      // 使用现有对话
      conversationId = existingConversation.rows[0].id;
      // 对话已存在，更新统计信息
      await pool.query(`
        UPDATE conversations 
        SET total_messages = total_messages + 1
        WHERE id = $1
      `, [conversationId]);
    } else {
      // 创建新对话
      const newConversation = await pool.query(`
        INSERT INTO conversations (
          job_id, candidate_id, recruiter_id, last_message,
          last_time, unread_count, total_messages, recruiter_unread, candidate_unread
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 0, 1, 1, 0)
        RETURNING id
      `, [jobId, actualCandidateId, actualRecruiterId, message]);

      conversationId = newConversation.rows[0].id;
    }

    // 获取招聘者的用户ID
    const recruiterUserResult = await pool.query(
      'SELECT user_id FROM recruiters WHERE id = $1',
      [recruiterId]
    );

    if (recruiterUserResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '招聘者不存在'
      });
    }

    const recruiterUserId = recruiterUserResult.rows[0].user_id;

    // 发送消息
    const newMessage = await pool.query(`
    INSERT INTO messages (
      conversation_id, sender_id, receiver_id, text, type, status, time, is_deleted
    ) VALUES ($1, $2, $3, $4, 'text', 'sent', CURRENT_TIMESTAMP, false)
    RETURNING *
  `, [conversationId, candidateId, recruiterUserId, message]);

    // 确定要更新的字段
    const updateFields = [
      'last_message = $1',
      'last_time = CURRENT_TIMESTAMP',
      'updated_at = CURRENT_TIMESTAMP'
    ];

    // 如果是现有对话，增加未读计数
    if (existingConversation.rows.length > 0) {
      updateFields.push('recruiter_unread = recruiter_unread + 1');
    }

    await pool.query(`
      UPDATE conversations 
      SET ${updateFields.join(', ')}
      WHERE id = $2
    `, [message, conversationId]);

    res.json({
      status: 'success',
      data: {
        conversationId,
        message: newMessage.rows[0]
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

    // 首先获取对话信息，包括关联的用户ID
    const conversation = await pool.query(`
      SELECT 
        cd.user_id AS candidate_user_id,
        r.user_id AS recruiter_user_id,
        c.candidate_id,
        c.recruiter_id
      FROM conversations c
      JOIN candidates cd ON c.candidate_id = cd.id
      JOIN recruiters r ON c.recruiter_id = r.id
      WHERE c.id = $1
    `, [conversationId]);

    if (conversation.rows.length === 0) {
      console.error('发送消息失败: 对话不存在', { conversationId });
      return res.status(404).json({ status: 'error', message: '对话不存在' });
    }

    const { candidate_user_id, recruiter_user_id, candidate_id, recruiter_id } = conversation.rows[0];

    console.log('对话关联用户ID:', {
      candidate_user_id,
      recruiter_user_id,
      candidate_id,
      recruiter_id
    });

    // 使用严格比较，并确保类型一致
    const senderIdNum = parseInt(senderId);
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
        conversation_id, sender_id, receiver_id, text, type, status, time, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, 'sent', CURRENT_TIMESTAMP, false)
      RETURNING *
    `, [conversationId, senderId, actualReceiverId, text, type]);

    // 确定要更新的未读字段：如果发送者是候选人，则招聘者有未读消息，反之亦然
    const unreadField = senderIdNum === candidateUserIdNum ? 'recruiter_unread' : 'candidate_unread';

    await pool.query(`
      UPDATE conversations 
      SET 
        last_message = $1,
        last_time = CURRENT_TIMESTAMP,
        total_messages = total_messages + 1,
        updated_at = CURRENT_TIMESTAMP,
        ${unreadField} = ${unreadField} + 1
      WHERE id = $2
    `, [text, conversationId]);

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
    await pool.query(`
      UPDATE conversations 
      SET ${updateField} = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [conversationId]);

    // 更新消息的状态为已读
    await pool.query(`
      UPDATE messages 
      SET status = 'read'
      WHERE conversation_id = $1 AND receiver_id = $2 AND status != 'read'
    `, [conversationId, userId]);

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
        COALESCE(u2.id, 0) AS recruiterId
      FROM conversations c
      -- 改进JOIN顺序，先JOIN较小的表
      LEFT JOIN recruiters r ON c.recruiter_id = r.id
      LEFT JOIN candidates cd ON c.candidate_id = cd.id
      LEFT JOIN users u1 ON cd.user_id = u1.id
      LEFT JOIN users u2 ON r.user_id = u2.id
      LEFT JOIN jobs j ON c.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.id
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
          status, time, is_deleted
        ) VALUES ($1, $2, $3, $4, 'image', $5, $6, $7, $8, 'sent', CURRENT_TIMESTAMP, false)
        RETURNING *
      `, [conversationId, senderId, receiverId, '[图片]', fileUrl, fileName, fileSize, fileType]);

      // 更新对话的最后一条消息
      const unreadField = await getUnreadField(conversationId, senderId);

      await pool.query(`
        UPDATE conversations 
        SET 
          last_message = $1,
          last_time = CURRENT_TIMESTAMP,
          total_messages = total_messages + 1,
          updated_at = CURRENT_TIMESTAMP,
          ${unreadField} = ${unreadField} + 1
        WHERE id = $2
      `, ['[图片]', conversationId]);

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

module.exports = router;