import { Expo, type ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export async function sendExpoPush(
  tokens: string[],
  message: Omit<ExpoPushMessage, "to">
) {
  const messages: ExpoPushMessage[] = tokens
    .filter((t) => Expo.isExpoPushToken(t))
    .map((to) => ({ ...message, to }));

  if (!messages.length) {
    return { sent: 0, tickets: [] as Awaited<ReturnType<typeof expo.sendPushNotificationsAsync>> };
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  for (const chunk of chunks) {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...ticketChunk);
  }
  return { sent: messages.length, tickets };
}
