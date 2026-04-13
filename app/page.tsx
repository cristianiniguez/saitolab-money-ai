import { getCurrentUser } from '@/lib/insforge/server'

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans p-8">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center py-16 px-8 bg-white shadow-sm border border-zinc-100 rounded-3xl mt-8">
        
        <div className="flex flex-col items-center text-center max-w-2xl">
          {user ? (
            <>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
                Welcome back!
              </h1>
              <p className="text-lg text-zinc-600 mb-12">
                Manage your incomes and expenses effortlessly. Your balance is up to date.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-left">
                  <div className="text-blue-600 font-semibold mb-1">Total Incomes</div>
                  <div className="text-3xl font-bold text-zinc-900">$0.00</div>
                </div>
                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-left">
                  <div className="text-red-600 font-semibold mb-1">Total Expenses</div>
                  <div className="text-3xl font-bold text-zinc-900">$0.00</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
                Take Control of Your <span className="text-blue-600">Money</span>
              </h1>
              <p className="text-lg leading-8 text-zinc-600 mb-10">
                SaitoLab Money is the simplest way to track your incomes and expenses. Securely log in to manage your financial health.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
