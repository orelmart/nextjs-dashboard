'use server';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

/* ────────────────────────────────
   Validation
   ─────────────────────────────── */
const FormSchema = z.object({
    customerId: z.string({
        required_error: 'Please pick a customer.',
    }),
    amount: z.coerce
        .number({
            invalid_type_error: 'Enter a number.',
            required_error: 'Please enter an amount.',
        })
        .gt(0, { message: 'Amount must be greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        required_error: 'Please select an invoice status.',
    }),
});

type ActionState = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

const toCents = (n: number) => Math.round(n * 100);

/* ────────────────────────────────
   CREATE  (used with useActionState)
   ─────────────────────────────── */
export async function createInvoice(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    /* Validate user input */
    const result = FormSchema.safeParse({
        customerId: formData.get('customerId'),
        amount:     formData.get('amount'),
        status:     formData.get('status'),
    });

    /* -------- validation failed -------- */
    if (!result.success) {
        return {
            errors:  result.error.flatten().fieldErrors,
            message: 'Missing or invalid fields.',
        };
    }

    /* -------- validation succeeded ------ */
    const { customerId, amount, status } = result.data;

    try {
        const date = new Date().toISOString().split('T')[0];
        await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${toCents(amount)}, ${status}, ${date});
    `;
        revalidatePath('/dashboard/invoices');
    } catch (err) {
        console.error('DB-CREATE error:', err);
        return { message: 'Database error. Please try again.' };
    }

    /* Success → redirect (won’t return to client) */
    redirect('/dashboard/invoices');
}

/* ────────────────────────────────
   UPDATE
   ─────────────────────────────── */
export async function updateInvoice(id: string, fd: FormData) {
    const { customerId, amount, status } = FormSchema.parse({
        customerId: fd.get('customerId'),
        amount:     fd.get('amount'),
        status:     fd.get('status'),
    });

    try {
        await sql`
      UPDATE invoices
      SET customer_id = ${customerId},
          amount      = ${toCents(amount)},
          status      = ${status}
      WHERE id = ${id};
    `;
        revalidatePath('/dashboard/invoices');
    } catch (err) {
        console.error('DB-UPDATE error:', err);
        throw new Error('Failed to update invoice.');
    }

    redirect('/dashboard/invoices');
}

/* ────────────────────────────────
   DELETE
   ─────────────────────────────── */
export async function deleteInvoice(id: string) {
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
    } catch (err) {
        console.error('DB-DELETE error:', err);
        throw new Error('Failed to delete invoice.');
    }
}
export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}
