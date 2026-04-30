type User = {
  id: string;
  email: string;
};

type UserRecord = {
  currentUser: User;
  metadata: {
    fallback: string;
  };
};

export function loadUser(record: UserRecord) {
  const fallbackKey = record.metadata.fallback;

  return Effect.gen(function* () {
    const user = yield* Effect.succeed(record.currentUser);

    return {
      user,
      fallbackKey,
    };
  });
}
