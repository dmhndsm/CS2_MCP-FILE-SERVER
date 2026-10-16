# 5-minute demo script

| Time | Do | Show |
|---|---|---|
| 0:00 | `pm2 status`, then `curl https://<tunnel>/health` | Server managed + public HTTPS |
| 0:30 | `curl -i -X POST https://<tunnel>/mcp` | 401 without token |
| 1:00 | `npm test` | 20 tests: traversal, symlink, dangling symlink, 413, auth |
| 1:45 | Session 1 in the real client (task below) | Tool calls + handoff files written |
| 3:00 | Close session. Start Session 2 fresh | Agent reads the 4 handoff files, resumes |
| 4:15 | Kill the process, `pm2 status` | Auto-restart, +1 restarts |
| 4:45 | `logs/audit.log` | Every write/delete logged |

## Demo task (needs >= 2 sessions)
"Create `notes/` with three research notes, write an `index.md` linking them, then (Session 2) add a
summary section to `index.md`, move one note into `archive/`, and search for a keyword to confirm."

**Session 1 prompt:** "Use the file server. Read workspace/PROJECT_STATE.md first. Do steps 1-2 of the task, then update PLAN_LOG.md and CHECKPOINTS.md with what's done and what's next."
**Session 2 prompt (new chat):** "Use the file server. Read all four handoff files, continue the task from where the last session stopped, then update the handoff files."
