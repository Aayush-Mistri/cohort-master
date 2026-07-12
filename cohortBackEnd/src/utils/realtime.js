export const toId = (value) => value?.toString();

export const getDistinctIds = (values = []) => (
  [...new Set(values.map((value) => toId(value)).filter(Boolean))]
);

export const getUserRoom = (userId) => `user:${toId(userId)}`;

export const emitToUserRooms = ({ req, userIds = [], event = 'app-refresh', payload = {} }) => {
  const io = req.app.get('io');
  if (!io) return;

  getDistinctIds(userIds).forEach((userId) => {
    io.to(getUserRoom(userId)).emit(event, payload);
  });
};
