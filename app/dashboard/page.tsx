import { getBalanceDataset } from "@/lib/db/queries/balances";
import { calculateBalances } from "@/lib/calculations/calculateBalances";

import { PageContainer } from "@/lib/ui/components/layout/PageContainer";
import { BalanceTable } from "@/lib/ui/components/balance/BalanceTable";
import { PairwiseDebts } from "@/lib/ui/components/balance/PairwiseDebts";

export default async function DashboardPage() {
  const dataset = await getBalanceDataset();
  const balances = calculateBalances(dataset);

  return (
    <PageContainer title="Dashboard">
      <div className="space-y-8">
        <BalanceTable balances={balances} />
        <PairwiseDebts balances={balances} />
      </div>
    </PageContainer>
  );
}
