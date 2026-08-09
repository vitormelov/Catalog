export const buildFriendshipId = (userIdA, userIdB) =>
  [userIdA, userIdB].sort().join('_');

export const getOtherParticipant = (friendship, currentUserId) => {
  const participants = friendship.participants || [];
  return participants.find((id) => id !== currentUserId) || null;
};

export const FRIENDSHIP_PENDING = 'pending';
export const FRIENDSHIP_ACCEPTED = 'accepted';

/** Contas antigas sem o campo continuam exibindo custos (padrão). */
export const userShowsCostsToFriends = (profile) => profile?.showCostsToFriends !== false;
