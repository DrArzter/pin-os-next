import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/utils/prisma';
import { signToken } from '@/utils/jwt';
import { hashPassword } from '@/utils/hashPassword';
import { handleError } from '@/utils/errorHandler'; // Импорт функции для обработки ошибок
import { z } from 'zod';

const registrationSchema = z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(1, 'Name is required'),
    password: z.string().min(6, 'Password is required'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Unsupported method' });
    }

    try {
        registrationSchema.parse(req.body);

        const { email, name, password } = req.body as { email: string, name: string, password: string };

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: await hashPassword(password),
                avatar: `https://ui-avatars.com/api/?name=${name}&background=ACACAC&color=fff`,
                background: `https://ui-avatars.com/api/?name=${name}&background=ACACAC&color=fff`,
            }
        });

        const token = signToken(user);

        res.setHeader('Set-Cookie', [
            `token=${token}; SameSite=lax; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30};` +
            (process.env.NODE_ENV === 'production' ? ' Secure;' : '')
        ]);

        return res.status(200).json({ status: 'success', message: 'Registration successful', token: token });

    } catch (error) {
        return handleError(res, error); // Обработка ошибки через общую функцию
    }
}
