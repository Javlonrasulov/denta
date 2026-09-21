import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getInboxNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type InboxNotification,
} from '@/services/inboxService';

export const inboxQueryKeys = {
  all: ['notifications'] as const,
  list: ['notifications', 'list'] as const,
  unread: ['notifications', 'unread'] as const,
};

export function useInboxNotifications(enabled = true) {
  return useQuery({
    queryKey: inboxQueryKeys.list,
    queryFn: getInboxNotifications,
    enabled,
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: inboxQueryKeys.unread,
    queryFn: getUnreadNotificationCount,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: inboxQueryKeys.all });
      const prevList = queryClient.getQueryData<InboxNotification[]>(inboxQueryKeys.list);
      const prevUnread = queryClient.getQueryData<number>(inboxQueryKeys.unread);

      queryClient.setQueryData<InboxNotification[]>(inboxQueryKeys.list, (rows) =>
        (rows ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      if (typeof prevUnread === 'number' && prevUnread > 0) {
        const wasUnread = prevList?.find((n) => n.id === id && !n.read);
        if (wasUnread) {
          queryClient.setQueryData<number>(inboxQueryKeys.unread, prevUnread - 1);
        }
      }
      return { prevList, prevUnread };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevList) queryClient.setQueryData(inboxQueryKeys.list, ctx.prevList);
      if (typeof ctx?.prevUnread === 'number') {
        queryClient.setQueryData(inboxQueryKeys.unread, ctx.prevUnread);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: inboxQueryKeys.all });
      const prevList = queryClient.getQueryData<InboxNotification[]>(inboxQueryKeys.list);
      const prevUnread = queryClient.getQueryData<number>(inboxQueryKeys.unread);
      queryClient.setQueryData<InboxNotification[]>(inboxQueryKeys.list, (rows) =>
        (rows ?? []).map((n) => ({ ...n, read: true })),
      );
      queryClient.setQueryData<number>(inboxQueryKeys.unread, 0);
      return { prevList, prevUnread };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prevList) queryClient.setQueryData(inboxQueryKeys.list, ctx.prevList);
      if (typeof ctx?.prevUnread === 'number') {
        queryClient.setQueryData(inboxQueryKeys.unread, ctx.prevUnread);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.all });
    },
  });
}
