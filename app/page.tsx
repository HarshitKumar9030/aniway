import Tracker from './tracker';
import { getCurrentUser } from '../lib/auth';
export const dynamic = 'force-dynamic';
export default async function Home() {
 const user = await getCurrentUser();
 return <Tracker user={user ? { name: user.fullName || user.displayName, email: user.email, provider:user.provider } : null} />;
}

