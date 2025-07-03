import { redirect } from 'next/navigation';

export default function Home() {
  redirect('https://discord.com/oauth2/authorize?client_id=1388979492193833152&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fv2%2Foauth%2Fdiscord&scope=identify');
}
