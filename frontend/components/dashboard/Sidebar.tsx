import Link from "next/link";
import { Badge } from "../ui/Badge";

type Prop = {
 balance: number;
  totalValue: number;
  dayPnl: number | null;   // <- fix
}

export default function Sidebar({ balance, totalValue, dayPnl }: Prop) {
  return (
    <aside className="hidden md:block w-[300px] sticky top-22 h-fit">
        <p className="font-semibold text-xl mb-3">
        Your Investments
        </p>

        <div className="border border-gray-300 rounded-xl p-6">
          <div className="space-y-4 flex flex-col gap-6">

            <div className="mb-2">
                <h2 className="text-lg font-semibold mb-2">Portfolio Value</h2>
                <p className="text-2xl font-bold mb-4">₹{totalValue}</p>
                <Link href="/portfolio" className="rounded-full py-1 px-2 border border-gray-400">View Details</Link>
            </div>

            <div className="mb-2">
              <h2 className="text-lg font-semibold mb-2">Today’s P&L</h2>
              <p className="text-2xl font-bold mb-4">₹{dayPnl?.toFixed()}</p>
              <Link href="/portfolio" className="rounded-full py-1 px-2 border border-gray-400">View Details</Link>
            </div>

            <div className="mb-2">
              <h2 className="text-lg font-semibold mb-2">Balance</h2>
              <p className="text-2xl font-bold mb-4">₹{balance}</p>  
              <Link href="/portfolio" className="rounded-full py-1 px-2 border border-gray-400">View Details</Link>
              
            </div>

          </div>
        </div>
    </aside>
  );
}

