type User = {
  profile?: {
    name: string;
  };
};

export function readProfile(user: User) {
  return user?.profile;
}
