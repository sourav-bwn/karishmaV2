const unavailable = async (..._args: any[]): Promise<any> => ({ data: null, error: { message: "Accounts are not enabled in this local MVP. Use Continue as guest." } });
export const authClient = { signIn: { email: unavailable }, signUp: { email: unavailable }, signOut: unavailable };
