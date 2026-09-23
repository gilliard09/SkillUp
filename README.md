This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Upgrade do app do aluno — 27/08/2026

Foi adicionada a migração `supabase/20260827_student_app_upgrade.sql`.

### Antes de publicar
1. Execute o SQL no Supabase SQL Editor.
2. Confirme que a tabela `settings` contém a chave `validation_password` usada pelo professor.
3. Faça `npm install` e `npm run build` localmente.
4. Publique normalmente no Vercel.

A migração cria as tabelas de atividades, conquistas, notificações e projetos e adiciona RPCs seguras para conclusão de aula, quiz e aprovação de desafios. O PIN do professor e as respostas corretas do quiz não são mais enviados ao navegador.
