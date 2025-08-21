import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { getServerPb } from '@/lib/pocketbase';
import { cookies } from 'next/headers'; // Import cookies here
import Navbar from '@/components/Nav';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'My SME Marketplace',
  description: 'A platform for SMEs to connect and trade',
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies(); // Await cookies() here
  const pb = getServerPb(cookieStore);

  let initialAuth = { token: null, model: null };
  if (pb.authStore.isValid) {
    initialAuth = { token: pb.authStore.token, model: pb.authStore.model };
  }

  return (
    <html lang="en">
      <head>
                <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className={inter.className}>
        <AuthProvider initialAuth={initialAuth}>
          <Navbar/>
          {children}
          <Footer/>
        </AuthProvider>
      </body>
    </html>
  );
}
