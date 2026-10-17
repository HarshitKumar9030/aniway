import Tracker from './tracker';
import { getChatGPTUser } from './chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function Home() {
 const user = await getChatGPTUser();
 return <Tracker user={user ? { name: user.fullName || user.displayName, email: user.email } : null} />;
}
