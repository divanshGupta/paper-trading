import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export default function Sidebar() {
  return (
    <aside className="w-[300px] sticky top-32 h-fit">
        <p className="font-semibold text-xl mb-3">
        Your Investments
        </p>

        <div className="border border-gray-300 rounded-xl p-6">
        <div className="space-y-4 flex flex-col gap-6">

          <div className="">
            <div className="mb-2">
              <h2 className="text-lg font-semibold mb-1">Portfolio Value</h2>
              <p className="text-2xl font-bold mb-1">$125,430</p>
              <Badge>+2.4%</Badge>
            </div>
            <button className="rounded-full py-1 px-2 border border-gray-400">View Details</button>
          </div>

          <div className="">
            <h2 className="text-lg font-semibold mb-1">Today’s P&L</h2>
            <p className="text-2xl font-bold mb-2">+₹5300</p>
            <button className="rounded-full py-1 px-2 border border-gray-400">View Details</button>
          </div>

          <div className="">
            <h2 className="text-lg font-semibold mb-1">Balance</h2>
            <p className="text-2xl font-bold mb-2">+₹25000</p>
            <button className="rounded-full py-1 px-2 border border-gray-400">View Details</button>
          </div>

        </div>
      </div>
    </aside>
  );
}

