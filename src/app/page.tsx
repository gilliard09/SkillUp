import { redirect } from 'next/navigation';

export default function RootPage() {
  // Isso faz com que qualquer pessoa que acesse o seu domínio principal
  // seja levada instantaneamente para a tela de login.
  redirect('/login');
}