// Guest-only web MVP. No OAuth requests or imported cloud account credentials.
export const googleClientId = "";
export const getGoogleClientId = async () => "";
export const isNativePlatform = () => false;
export const isGoogleAuthAvailable = () => false;
export interface GoogleAuthPayload { idToken: string; accessToken?: string }
const reason = "Sign-in is not enabled in this personal MVP. Use Continue as guest. History and memory stay in this browser.";
export async function signInWithGoogle(..._args: any[]): Promise<any> { throw new Error(reason); }
export async function renderGoogleButton(..._args: any[]): Promise<any> { return false; }
export async function nativeGoogleIdToken(): Promise<string> { throw new Error(reason); }
export async function promptGoogleSignIn(..._args: any[]): Promise<any> { throw new Error(reason); }
export async function nativeGoogleSignOut(): Promise<void> {}
