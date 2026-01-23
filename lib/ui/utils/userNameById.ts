type UserNameRow = {
  id: string;
  name: string;
};

export const buildUserNameById = (users: UserNameRow[]) => {
  return users.reduce<Record<string, string>>((acc, user) => {
    acc[user.id] = user.name;
    return acc;
  }, {});
};
