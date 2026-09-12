import { useEffect, useRef } from 'react';
import { getToken } from '@/utils/api';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const RECONNECT_DELAY_MS = 3000;

/**
 * 订阅教师端风险预警的实时推送。
 *
 * 用 fetch + ReadableStream 而不是原生 EventSource：EventSource 无法携带
 * Authorization 头，而本项目所有接口都走 Bearer token。把 token 塞进 URL 查询参数
 * 也能跑通，但那会让令牌进入 nginx 访问日志，所以不这么做。
 *
 * 这里只负责通知「有变化」，具体数据由调用方重新拉取，避免维护两份状态。
 */
export function useRiskStream(onEvent: () => void, enabled = true) {
  // 用 ref 持有最新回调，避免调用方每次渲染换函数导致长连接反复重建
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    const token = getToken();
    if (!token) return;

    let stopped = false;
    const controller = new AbortController();

    async function connect() {
      while (!stopped) {
        try {
          const res = await fetch(`${API_BASE}/api/teacher/risk-events/stream`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
            signal: controller.signal,
          });
          if (!res.ok || !res.body) throw new Error('stream unavailable');

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // SSE 以空行分隔消息块；这里只关心事件名，数据由调用方自己拉
            let sep = buffer.indexOf('\n\n');
            while (sep !== -1) {
              const chunk = buffer.slice(0, sep);
              buffer = buffer.slice(sep + 2);
              if (chunk.startsWith('event: risk-event')) handlerRef.current();
              sep = buffer.indexOf('\n\n');
            }
          }
        } catch {
          // 连接中断或组件卸载触发的 abort，统一走下面的重连判断
        }

        if (stopped) return;
        await new Promise((r) => setTimeout(r, RECONNECT_DELAY_MS));
      }
    }

    void connect();

    return () => {
      stopped = true;
      controller.abort();
    };
  }, [enabled]);
}
