import { getBalances } from '@/lib/db/queries/balances';

export const revalidate = 0;

const page = async () => {
    const balances = await getBalances();

    return (
    <div>
        <h1>Balances</h1>
        <pre>{JSON.stringify(balances, null, 2)}</pre>
    </div>
  )
}

export default page