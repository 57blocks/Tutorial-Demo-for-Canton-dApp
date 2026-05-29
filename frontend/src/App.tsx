import { LoopProvider } from './context/LoopContext';
import { Header } from './components/Header';
import { Holdings } from './components/Holdings';
import { CredentialOffers } from './components/CredentialOffers';

function App() {
  return (
    <LoopProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
          <CredentialOffers />
          <section>
            <h2 className="text-lg font-semibold mb-4">Holdings</h2>
            <Holdings />
          </section>
        </main>
      </div>
    </LoopProvider>
  );
}

export default App;
