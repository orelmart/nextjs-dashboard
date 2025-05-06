'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const Form = z.object({
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
});
type FormDataShape = z.infer<typeof Form>;

function cents(n: number) {
    return n * 100;
}

/* ------------ CREATE ------------ */
export async function createInvoice(fd: FormData) {
    const { customerId, amount, status } = Form.parse({
        customerId: fd.get('customerId'),
        amount:     fd.get('amount'),
        status:     fd.get('status'),
    });

    try {
        const date = new Date().toISOString().split('T')[0];
        await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${cents(amount)}, ${status}, ${date});
    `;
        revalidatePath('/dashboard/invoices');
    } catch (err) {
        console.error('DB‑CREATE error:', err);
        throw new Error('Failed to create invoice.');
    }

    redirect('/dashboard/invoices');
}

/* ------------ UPDATE ------------ */
export async function updateInvoice(id: string, fd: FormData) {
    const { customerId, amount, status } = Form.parse({
        customerId: fd.get('customerId'),
        amount:     fd.get('amount'),
        status:     fd.get('status'),
    });

    try {
        await sql`
      UPDATE invoices
      SET customer_id = ${customerId},
          amount      = ${cents(amount)},
          status      = ${status}
      WHERE id = ${id};
    `;
        revalidatePath('/dashboard/invoices');
    } catch (err) {
        console.error('DB‑UPDATE error:', err);
        throw new Error('Failed to update invoice.');
    }

    redirect('/dashboard/invoices');
}

/* ------------ DELETE ------------ */
export async function deleteInvoice(id: string) {
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
    } catch (err) {
        console.error('DB‑DELETE error:', err);
        throw new Error('Failed to delete invoice.');
    }
}
