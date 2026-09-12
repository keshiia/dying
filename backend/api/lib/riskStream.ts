/**
 * 风险预警的实时推送通道（SSE）
 *
 * 教师端打开页面时建立一个长连接，学生触发预警后服务端主动推过去，
 * 不需要教师手动刷新。用 SSE 而不是 WebSocket：这里是单向推送，SSE 够用且不引入新依赖。
 *
 * 注意：浏览器原生 EventSource 无法携带 Authorization 头，所以前端用
 * fetch + ReadableStream 自行解析，token 仍然走标准的 Bearer 头。
 */

import type { Response } from 'express'

type Client = {
  teacherId: string
  res: Response
}

const clients = new Set<Client>()

// 心跳间隔，防止中间代理把空闲长连接掐断
const HEARTBEAT_MS = 25_000

export function addRiskStreamClient(teacherId: string, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // 让 nginx 不要缓冲，否则推送会被攒着不发
  })
  res.write(': connected\n\n')

  const client: Client = { teacherId, res }
  clients.add(client)

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n')
    } catch {
      // 连接已断，交给下面的 close 处理
    }
  }, HEARTBEAT_MS)

  const cleanup = () => {
    clearInterval(heartbeat)
    clients.delete(client)
  }

  res.on('close', cleanup)
  res.on('error', cleanup)

  return cleanup
}

/** 向某位教师推送一个事件；没有活跃连接时静默丢弃（前端下次拉列表仍能看到） */
export function pushToTeacher(teacherId: string, event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of clients) {
    if (client.teacherId !== teacherId) continue
    try {
      client.res.write(payload)
    } catch {
      clients.delete(client)
    }
  }
}

export function activeRiskStreamCount() {
  return clients.size
}
