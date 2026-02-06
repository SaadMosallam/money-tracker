type UserRow = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

export const buildUserById = (users: UserRow[]) => {
  return users.reduce<Record<string, UserRow>>((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
};
