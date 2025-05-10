'use client';

import { useActionState } from 'react';            // ⬅️ from 'react'
import { useFormStatus } from 'react-dom';         // status hook still in react-dom
import clsx from 'clsx';
import Link from 'next/link';

import { createInvoice } from '@/app/lib/actions';
import { CustomerField } from '@/app/lib/definitions';
import { Button } from '@/app/ui/button';

/* ---------------------------------------------------------------------------
   Client-side state returned by createInvoice
   --------------------------------------------------------------------------- */
type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const initialState: State = { errors: {}, message: null };

/* ---------------------------------------------------------------------------
   Submit button (announces pending state to assistive tech)
   --------------------------------------------------------------------------- */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
      <Button type="submit" aria-disabled={pending} className="w-full md:w-auto">
        {pending ? 'Creating…' : 'Create Invoice'}
      </Button>
  );
}

/* ---------------------------------------------------------------------------
   Create-invoice form
   --------------------------------------------------------------------------- */
export default function CreateInvoiceForm({
                                            customers,
                                          }: {
  customers: CustomerField[];
}) {
  const [state, dispatch] = useActionState(createInvoice, initialState);

  return (
      <form action={dispatch} className="space-y-8">
        {/* ----------------------------- Amount ----------------------------- */}
        <div>
          <label
              htmlFor="amount"
              className="block text-sm font-medium leading-6 text-gray-900"
          >
            Amount
          </label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0.00"
                aria-describedby="amount-error"
                className={clsx(
                    'block w-full rounded-md border-0 py-1.5 ring-1 ring-inset ring-gray-300',
                    state.errors?.amount && 'ring-red-500',
                )}
            />
          </div>
          {state.errors?.amount?.[0] && (
              <p
                  id="amount-error"
                  role="alert"
                  aria-live="polite"
                  className="mt-2 text-sm text-red-600"
              >
                {state.errors.amount[0]}
              </p>
          )}
        </div>

        {/* --------------------------- Customer ---------------------------- */}
        <div>
          <label
              htmlFor="customer"
              className="block text-sm font-medium leading-6 text-gray-900"
          >
            Customer
          </label>
          <select
              id="customer"
              name="customerId"
              defaultValue=""
              aria-describedby="customer-error"
              className={clsx(
                  'mt-2 block w-full rounded-md border-0 py-1.5 ring-1 ring-inset ring-gray-300 bg-white',
                  state.errors?.customerId && 'ring-red-500',
              )}
          >
            <option value="" disabled>
              Select a customer
            </option>
            {customers.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
            ))}
          </select>
          {state.errors?.customerId?.[0] && (
              <p
                  id="customer-error"
                  role="alert"
                  aria-live="polite"
                  className="mt-2 text-sm text-red-600"
              >
                {state.errors.customerId[0]}
              </p>
          )}
        </div>

        {/* ----------------------------- Status ---------------------------- */}
        <fieldset>
          <legend className="block text-sm font-medium leading-6 text-gray-900">
            Status
          </legend>
          <div className="mt-2 flex gap-6">
            <label className="flex items-center gap-2">
              <input
                  type="radio"
                  name="status"
                  value="pending"
                  defaultChecked
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Pending</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                  type="radio"
                  name="status"
                  value="paid"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Paid</span>
            </label>
          </div>
          {state.errors?.status?.[0] && (
              <p
                  id="status-error"
                  role="alert"
                  aria-live="polite"
                  className="mt-2 text-sm text-red-600"
              >
                {state.errors.status[0]}
              </p>
          )}
        </fieldset>

        {/* -------------------- Form-level message -------------------------- */}
        {state.message && (
            <p role="alert" aria-live="assertive" className="text-sm text-red-600">
              {state.message}
            </p>
        )}

        {/* ------------------------- Actions ------------------------------- */}
        <div className="flex items-center gap-4">
          <SubmitButton />
          <Link
              href="/dashboard/invoices"
              className="text-sm font-semibold leading-6 text-gray-900"
          >
            Cancel
          </Link>
        </div>
      </form>
  );
}
