import { JWTPayload } from '@/lib/auth';
import { getCardPermissions } from '@/lib/taskPermissions';

export type TaskUpdateResult = 
  | { type: 'SUCCESS'; newVersion: number }
  | { type: 'NOT_FOUND'; error: string }
  | { type: 'FORBIDDEN'; error: string }
  | { type: 'CONFLICT'; latestCard: any; error: string }
  | { type: 'SYNC_ERROR'; error: string };

/**
 * Helper to update task_cards and tasks together atomically using D1 db.batch and write_token
 */
export async function updateTaskAtomically(
  db: any,
  user: JWTPayload,
  cardId: string,
  providedVersion: number,
  updates: {
    taskCardsSet?: string;
    taskCardsParams?: any[];
    tasksSet?: string;
    tasksParams?: any[];
  },
  masterTable: 'task_cards' | 'tasks' = 'task_cards'
): Promise<TaskUpdateResult> {
  const writeToken = crypto.randomUUID();
  const newVersion = providedVersion + 1;

  // 1. Kiểm tra tồn tại ở bảng nào
  const tcRow = await db.prepare('SELECT id FROM task_cards WHERE id = ?').bind(cardId).first();
  const tRow = await db.prepare('SELECT id FROM tasks WHERE id = ?').bind(cardId).first();

  if (!tcRow && !tRow) {
    return { type: 'NOT_FOUND', error: 'Thẻ công việc không tồn tại hoặc đã bị xóa.' };
  }

  const batchQueries = [];
  let masterIndex = -1;

  if (tcRow && tRow) {
    // Tồn tại ở cả 2 bảng
    if (masterTable === 'task_cards') {
      batchQueries.push(
        db.prepare(`UPDATE task_cards SET ${updates.taskCardsSet || 'updated_at=CURRENT_TIMESTAMP'}, version = ?, write_token = ? WHERE id = ? AND version = ?`)
          .bind(...(updates.taskCardsParams || []), newVersion, writeToken, cardId, providedVersion)
      );
      masterIndex = 0;
      if (updates.tasksSet) {
        batchQueries.push(
          db.prepare(`UPDATE tasks SET ${updates.tasksSet}, version = version + 1, write_token = ? WHERE id = ? AND EXISTS (SELECT 1 FROM task_cards WHERE id = ? AND write_token = ?)`)
            .bind(...(updates.tasksParams || []), writeToken, cardId, cardId, writeToken)
        );
      }
    } else {
      batchQueries.push(
        db.prepare(`UPDATE tasks SET ${updates.tasksSet || 'updated_at=CURRENT_TIMESTAMP'}, version = ?, write_token = ? WHERE id = ? AND version = ?`)
          .bind(...(updates.tasksParams || []), newVersion, writeToken, cardId, providedVersion)
      );
      masterIndex = 0;
      if (updates.taskCardsSet) {
        batchQueries.push(
          db.prepare(`UPDATE task_cards SET ${updates.taskCardsSet}, version = version + 1, write_token = ? WHERE id = ? AND EXISTS (SELECT 1 FROM tasks WHERE id = ? AND write_token = ?)`)
            .bind(...(updates.taskCardsParams || []), writeToken, cardId, cardId, writeToken)
        );
      }
    }
  } else if (tcRow) {
    // Chỉ có ở task_cards
    batchQueries.push(
      db.prepare(`UPDATE task_cards SET ${updates.taskCardsSet || 'updated_at=CURRENT_TIMESTAMP'}, version = ?, write_token = ? WHERE id = ? AND version = ?`)
        .bind(...(updates.taskCardsParams || []), newVersion, writeToken, cardId, providedVersion)
    );
    masterIndex = 0;
  } else if (tRow) {
    // Chỉ có ở tasks
    batchQueries.push(
      db.prepare(`UPDATE tasks SET ${updates.tasksSet || 'updated_at=CURRENT_TIMESTAMP'}, version = ?, write_token = ? WHERE id = ? AND version = ?`)
        .bind(...(updates.tasksParams || []), newVersion, writeToken, cardId, providedVersion)
    );
    masterIndex = 0;
  }

  const batchResults = await db.batch(batchQueries);
  const primaryResult = batchResults[masterIndex];

  // Nếu câu chính thất bại => Version conflict hoặc bị xoá
  if (primaryResult.meta.changes === 0) {
    const latestCard = await db.prepare(masterTable === 'task_cards' ? 'SELECT * FROM task_cards WHERE id = ?' : 'SELECT * FROM tasks WHERE id = ?').bind(cardId).first();
    
    if (!latestCard) return { type: 'NOT_FOUND', error: 'Thẻ công việc không tồn tại.' };

    const perms = await getCardPermissions(db, cardId, user, masterTable === 'task_cards' ? 'legacy' : 'V2');
    if (!perms.hasAccess) {
      return { type: 'FORBIDDEN', error: 'Bạn đã mất quyền truy cập thẻ công việc này.' };
    }

    // Xoá write_token khỏi payload trả về client
    delete latestCard.write_token;

    return { 
      type: 'CONFLICT', 
      latestCard: { ...latestCard, permissions: 'permissions' in perms ? perms.permissions : undefined }, 
      error: 'Thẻ vừa được cập nhật bởi người khác. Vui lòng thử lại.' 
    };
  }

  // Check consistency
  if (tcRow && tRow && batchQueries.length === 2) {
    const secondaryResult = batchResults[1];
    if (secondaryResult.meta.changes === 0) {
      console.error(`[SYNC ERROR] Card ${cardId} master updated but secondary failed! WriteToken: ${writeToken}`);
      // Lỗi bất đồng bộ cực đoan, trả 500 để client đồng bộ lại
      return { type: 'SYNC_ERROR', error: 'Lỗi đồng bộ hệ thống. Vui lòng tải lại trang (F5) để đối soát dữ liệu.' } as any;
    }
  }

  return { type: 'SUCCESS', newVersion };
}

/**
 * Helper to delete a task atomically from both tables
 */
export async function deleteTaskAtomically(
  db: any,
  user: JWTPayload,
  cardId: string,
  providedVersion: number,
  masterTable: 'task_cards' | 'tasks' = 'tasks'
): Promise<TaskUpdateResult> {
  const tcRow = await db.prepare('SELECT id FROM task_cards WHERE id = ?').bind(cardId).first();
  const tRow = await db.prepare('SELECT id FROM tasks WHERE id = ?').bind(cardId).first();

  if (!tcRow && !tRow) return { type: 'NOT_FOUND', error: 'Thẻ công việc đã bị xóa.' };

  const checkTable = masterTable === 'task_cards' ? (tcRow ? 'task_cards' : 'tasks') : (tRow ? 'tasks' : 'task_cards');
  const checkCard = await db.prepare(`SELECT * FROM ${checkTable} WHERE id = ?`).bind(cardId).first();
  const perms = await getCardPermissions(db, cardId, user, checkTable === 'tasks' ? 'V2' : 'legacy');

  if (!perms.hasAccess) {
    return { type: 'FORBIDDEN', error: 'Bạn không có quyền xóa thẻ này.' };
  }

  const batchQueries = [];
  let masterIndex = -1;

  if (tcRow && tRow) {
    if (masterTable === 'tasks') {
      // Secondary first, checking master's version
      batchQueries.push(db.prepare('DELETE FROM task_cards WHERE id = ? AND EXISTS (SELECT 1 FROM tasks WHERE id = ? AND version = ?)').bind(cardId, cardId, providedVersion));
      batchQueries.push(db.prepare('DELETE FROM tasks WHERE id = ? AND version = ?').bind(cardId, providedVersion));
      masterIndex = 1;
    } else {
      batchQueries.push(db.prepare('DELETE FROM tasks WHERE id = ? AND EXISTS (SELECT 1 FROM task_cards WHERE id = ? AND version = ?)').bind(cardId, cardId, providedVersion));
      batchQueries.push(db.prepare('DELETE FROM task_cards WHERE id = ? AND version = ?').bind(cardId, providedVersion));
      masterIndex = 1;
    }
  } else if (tcRow) {
    batchQueries.push(db.prepare('DELETE FROM task_cards WHERE id = ? AND version = ?').bind(cardId, providedVersion));
    masterIndex = 0;
  } else if (tRow) {
    batchQueries.push(db.prepare('DELETE FROM tasks WHERE id = ? AND version = ?').bind(cardId, providedVersion));
    masterIndex = 0;
  }

  const batchResults = await db.batch(batchQueries);
  const primaryResult = batchResults[masterIndex];

  if (primaryResult.meta.changes === 0) {
    const latestCard = await db.prepare(`SELECT * FROM ${checkTable} WHERE id = ?`).bind(cardId).first();
    if (!latestCard) return { type: 'NOT_FOUND', error: 'Thẻ công việc đã bị xóa.' };
    delete latestCard.write_token;
    return {
      type: 'CONFLICT',
      latestCard: { ...latestCard, permissions: 'permissions' in perms ? perms.permissions : undefined },
      error: 'Thẻ vừa được cập nhật bởi người khác.'
    };
  }

  if (tcRow && tRow) {
    if (batchResults[0].meta.changes === 0) {
      console.error(`[SYNC ERROR] Card ${cardId} master deleted but secondary failed to delete!`);
      return { type: 'SYNC_ERROR', error: 'Lỗi đồng bộ hệ thống. Vui lòng tải lại trang (F5) để đối soát dữ liệu.' } as any;
    }
  }

  return { type: 'SUCCESS', newVersion: 0 };
}


